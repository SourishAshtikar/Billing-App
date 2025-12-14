const db = require('../models');
const User = db.User;
const bcrypt = require('bcryptjs');
const fs = require('fs');
const csv = require('csv-parser');

exports.createProject = async (req, res) => {
  try {
    const project = await db.Project.create({
      code: req.body.code,
      name: req.body.name
    });
    res.status(201).send(project);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await db.Project.findAll();
    res.status(200).send(projects);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await User.findAll({
      where: { role: 'employee' },
      include: [{
        model: db.Project,
        through: { attributes: [] }
      }]
    });
    res.status(200).send(employees);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.assignEmployee = async (req, res) => {
  try {
    const { projectId, userId } = req.body;
    const project = await db.Project.findByPk(projectId);
    const user = await User.findByPk(userId);

    if (!project || !user) {
      return res.status(404).send({ message: "Project or User not found." });
    }

    await project.addUser(user);
    res.status(200).send({ message: "Employee assigned to project successfully!" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.uploadUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: "Please upload a CSV file!" });
    }

    const users = [];
    const path = require('path');
    const uploadPath = path.resolve(__dirname, '../../uploads', req.file.filename);

    fs.createReadStream(uploadPath)
      .pipe(csv())
      .on('data', (row) => {
        // Expected header: Name, Email, EmpID
        // Map to DB fields
        users.push({
          name: row.Name,
          email: row.Email,
          employee_id: row['EmpID'] || row.EmpID,
          password: bcrypt.hashSync('welcome123', 8),
          role: 'employee',
          hourly_rate: 0 // Default, can be updated later
        });
      })
      .on('end', async () => {
        try {
          // Using bulkCreate with ignoreDuplicates for simplicity or handle individually
          // For now, let's just loop to handle potential errors individually without stopping
          let count = 0;
          for (const user of users) {
            const exists = await User.findOne({ where: { email: user.email } });
            if (!exists) {
              await User.create(user);
              count++;
            }
          }
          fs.unlinkSync(uploadPath); // Delete file after processing
          res.status(200).send({ message: `Uploaded and processed ${count} new employees successfully.` });
        } catch (error) {
          res.status(500).send({ message: "Fail to import data into database!", error: error.message });
        }
      });
  } catch (error) {
    res.status(500).send({ message: "Could not upload the file: " + req.file.originalname, error: error.message });
  }
};

exports.getProjectEmployees = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await db.Project.findByPk(projectId, {
      include: [{
        model: User,
        through: { attributes: [] }
      }]
    });

    if (!project) {
      return res.status(404).send({ message: "Project not found." });
    }

    res.status(200).send(project.users);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, employee_id, hourly_rate, password, projectId } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.employee_id = employee_id || user.employee_id;
    user.hourly_rate = hourly_rate !== undefined ? hourly_rate : user.hourly_rate;

    if (password) {
      user.password = bcrypt.hashSync(password, 8);
    }

    await user.save();

    if (projectId) {
      const project = await db.Project.findByPk(projectId);
      if (project) {
        await user.setProjects([project]);
      }
    }

    res.status(200).send({ message: "User updated successfully!" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    await user.destroy();
    res.status(200).send({ message: "User deleted successfully!" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
