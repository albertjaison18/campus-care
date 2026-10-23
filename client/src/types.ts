export type User = { id: string; name: string; email: string; role: 'student' | 'admin' };
export type Status = 'Open' | 'In progress' | 'Resolved' | 'Closed';
export type Priority = 'Low' | 'Medium' | 'High';
export type Issue = {
  _id: string; title: string; description: string; location: string; category: string;
  priority: Priority; status: Status; assignee: string;
  reporter: { _id: string; name: string; email: string };
  createdAt: string; updatedAt: string;
  history?: { _id: string; actor: string; message: string; kind: string; at: string }[];
};
export type IssueInput = Pick<Issue, 'title' | 'description' | 'location' | 'category' | 'priority'>;
export type Meta = { categories: string[]; statuses: Status[]; priorities: Priority[]; assignees: string[] };
export type Stats = { total: number; counts: Record<Status, number>; categories: { _id: string; count: number }[] };
export type IssueList = { items: Issue[]; total: number; page: number; pages: number };
