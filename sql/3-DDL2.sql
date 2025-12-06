-- 외래키 추가 (**INSERT문 이후 추가 해야함)
ALTER TABLE STUDENT ADD CONSTRAINT fk_student_department FOREIGN KEY (Dept_id) REFERENCES DEPARTMENT(Dept_id); 
ALTER TABLE SECTION ADD CONSTRAINT fk_section_course FOREIGN KEY (Course_id) REFERENCES COURSE(Course_id); 
-- STUDENT 테이블 참조 FK
ALTER TABLE TAKES ADD CONSTRAINT fk_takes_student 
	FOREIGN KEY (Student_id) 
	REFERENCES STUDENT(Student_id)
	ON DELETE CASCADE; -- 학생이 삭제되면 수강신청 내역도 함께 삭제

-- FK가 (Course_id, Section_id) 복합 키를 참조하도록 변경
ALTER TABLE TAKES ADD CONSTRAINT fk_takes_section 
	FOREIGN KEY (Course_id, Section_id) 
	REFERENCES SECTION(Course_id, Section_id)
	ON DELETE CASCADE; -- 분반이 삭제되면 수강신청 내역도 함께 삭제
ALTER TABLE DEPARTMENT_EVENT ADD CONSTRAINT fk_deptevent_dept FOREIGN KEY (Department_id) REFERENCES DEPARTMENT(Dept_id);
ALTER TABLE DEPT_LOCATION ADD CONSTRAINT fk_deptloc_deptevent FOREIGN KEY (Dept_event_id) REFERENCES DEPARTMENT_EVENT(Dept_event_id);
ALTER TABLE SCHEDULE ADD CONSTRAINT fk_schedule_student FOREIGN KEY (Student_id) REFERENCES STUDENT(Student_id);
ALTER TABLE STUDENT_GROUP ADD CONSTRAINT fk_group_leader FOREIGN KEY (Leader) REFERENCES STUDENT(Student_id); -- GROUP 테이블 리더 FK 추가
ALTER TABLE MEMBER ADD CONSTRAINT fk_member_group FOREIGN KEY (Group_id) REFERENCES STUDENT_GROUP(Group_id); -- 참조 테이블 이름 수정
ALTER TABLE MEMBER ADD CONSTRAINT fk_member_student FOREIGN KEY (Student_id) REFERENCES STUDENT(Student_id); -- MEMBER 테이블 학생 FK 추가

-- 멤버는 반드시 존재하는 그룹에 속함
ALTER TABLE MEMBER
  ADD CONSTRAINT fk_member_group
  FOREIGN KEY (Group_id) REFERENCES STUDENT_GROUP(Group_id);

-- 멤버는 반드시 존재하는 학생이어야 함
ALTER TABLE MEMBER
  ADD CONSTRAINT fk_member_student
  FOREIGN KEY (Student_id) REFERENCES STUDENT(Student_id);

commit;
