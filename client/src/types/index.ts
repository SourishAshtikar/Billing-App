export interface Project {
    id: string;
    code: string;
    name: string;
    description?: string;
    startDate: string;
    status: 'ACTIVE' | 'COMPLETED';
    _count?: {
        resources: number;
    };
}
