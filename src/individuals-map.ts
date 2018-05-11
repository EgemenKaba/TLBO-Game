import { Individual } from "./individual";

export class IndividualsMap {
    student: Individual;
    teacher: Individual;

    constructor(student, teacher) {
        this.student = student;
        this.teacher = teacher;
    }
}