import React from 'react';
import Modal from '../UI/Modal';
import ResourceWorkingDaysChart from './ResourceWorkingDaysChart';
import Button from '../UI/Button';

interface ResourceAnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    resource: any;
}

const ResourceAnalyticsModal: React.FC<ResourceAnalyticsModalProps> = ({ isOpen, onClose, resource }) => {
    if (!resource) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Analytics: ${resource.name}`}>
            <ResourceWorkingDaysChart resourceId={resource.id} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button onClick={onClose}>Close</Button>
            </div>
        </Modal>
    );
};

export default ResourceAnalyticsModal;
