export interface MessageModel {
    message: string;
    type: 'danger' | 'warning' | 'success' | 'info' | 'primary' | 'secondary' | 'tertiary' | 'light' | 'medium' | 'dark';
}