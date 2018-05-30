import { Individual } from "./individual";

export class GroupedIndividuals {
    student: Individual;
    teacher: Individual;

    constructor(student, teacher) {
        this.student = student;
        this.teacher = teacher;
    }
}