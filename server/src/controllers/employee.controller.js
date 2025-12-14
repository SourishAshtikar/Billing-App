const db = require('../models');
const Leave = db.Leave;
const User = db.User;

exports.markLeave = async (req, res) => {
  try {
    const { date, reason } = req.body;
    // Check if leave already exists for this date
    const existingLeave = await Leave.findOne({
      where: {
        user_id: req.userId,
        date: date
      }
    });

    if (existingLeave) {
      return res.status(400).send({ message: "Leave already marked for this date." });
    }

    const leave = await Leave.create({
      user_id: req.userId,
      date,
      reason
    });
    res.status(201).send(leave);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getLeaves = async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      where: { user_id: req.userId }
    });
    res.status(200).send(leaves);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] }
    });
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.deleteLeave = async (req, res) => {
  try {
    const leaveId = req.params.id;
    const userId = req.userId;

    const leave = await Leave.findOne({
      where: {
        id: leaveId,
        user_id: userId
      }
    });

    if (!leave) {
      return res.status(404).send({ message: "Leave not found or unauthorized." });
    }

    await leave.destroy();

    res.status(200).send({ message: "Leave deleted successfully!" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.updateLeave = async (req, res) => {
  try {
    const leaveId = req.params.id;
    const userId = req.userId;
    const { date, reason } = req.body;

    const leave = await Leave.findOne({
      where: {
        id: leaveId,
        user_id: userId
      }
    });

    if (!leave) {
      return res.status(404).send({ message: "Leave not found or unauthorized." });
    }

    leave.date = date || leave.date;
    leave.reason = reason || leave.reason;
    await leave.save();

    res.status(200).send({ message: "Leave updated successfully!" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
