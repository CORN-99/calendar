-- Drop all tables first to ensure a clean start
DROP TABLE MEMBER CASCADE CONSTRAINTS;		
DROP TABLE SCHEDULE CASCADE CONSTRAINTS;
DROP TABLE DEPT_LOCATION CASCADE CONSTRAINTS;
DROP TABLE TAKES CASCADE CONSTRAINTS; 		
DROP TABLE DEPARTMENT_EVENT CASCADE CONSTRAINTS;
DROP TABLE ACADEMIC_EVENT CASCADE CONSTRAINTS;
DROP TABLE SECTION CASCADE CONSTRAINTS;
DROP TABLE COURSE CASCADE CONSTRAINTS;
DROP TABLE STUDENT_GROUP CASCADE CONSTRAINTS; -- 이름 변경: GROUP -> STUDENT_GROUP
DROP TABLE DEPARTMENT CASCADE CONSTRAINTS;
DROP TABLE STUDENT CASCADE CONSTRAINTS; 

-- Create Tables
CREATE TABLE STUDENT (
	Student_id 	CHAR(10)		PRIMARY KEY,
	Name		VARCHAR2(30)	NOT NULL,      
	Dept_id	VARCHAR2(4)	NOT NULL
);

CREATE TABLE DEPARTMENT (
    Dept_id		VARCHAR2(4)	PRIMARY KEY,       
    Dept_name	VARCHAR2(50)	NOT NULL UNIQUE 
);

CREATE TABLE COURSE (
   	Course_id	VARCHAR2(20)	NOT NULL,   -- 강좌번호 (예: COMP0320)
   	Title		VARCHAR2(100)	NOT NULL,   -- 교과목명 (길이 증가)
    Credits	    NUMBER(2)		NOT NULL,   -- 학점 (INT -> NUMBER)
	PRIMARY	KEY (Course_id)
);

CREATE TABLE SECTION (
	Section_id		VARCHAR2(30)	NOT NULL,
	Academic_term	NUMBER(6)		NOT NULL,   -- 학기 (INT -> NUMBER, 예: 202501)
	Course_id		VARCHAR2(20)	NOT NULL,
	Time			VARCHAR2(150),
	Location		VARCHAR2(150),
	PRIMARY		KEY (Section_id, Course_id)
);  

CREATE TABLE TAKES (
	Student_id      CHAR(10)        NOT NULL,   -- STUDENT를 참조하는 FK
	Course_id       VARCHAR2(20)    NOT NULL,   -- SECTION을 참조하는 (복합) FK의 일부
	Section_id      VARCHAR2(30)    NOT NULL,   -- SECTION을 참조하는 (복합) FK의 일부
	-- "어떤 학생이", "어떤 과목의", "어떤 분반"을 수강했는가는 유일해야 함
	PRIMARY KEY (Student_id, Course_id, Section_id)
);

CREATE TABLE ACADEMIC_EVENT(
    Academic_event_id	NUMBER		NOT NULL,
    Title			VARCHAR2(200)	NOT NULL,
    Start_date		DATE			NOT NULL,
    End_date		DATE,
    PRIMARY KEY (Academic_event_id)
);

CREATE TABLE DEPARTMENT_EVENT(
    Department_id		VARCHAR2(4)	NOT NULL,	--DEPARTMENT relation의 Dept_id 외래키
    Dept_event_id		NUMBER		NOT NULL,
    Title               	VARCHAR2(200)	NOT NULL,
    Start_date          	DATE            	NOT NULL,
    End_date            	DATE            	NOT NULL,
    PRIMARY KEY (Dept_event_id)
);

-- ER-Diagram에서 DEPARTMENT_EVENT의 Location Attribute를 DEPT_LOCATION table로 분리
CREATE TABLE DEPT_LOCATION(				
	Dept_event_id	NUMBER		NOT NULL,
	Location		VARCHAR2(40)	NOT NULL,
	PRIMARY KEY (Dept_event_id, Location)
);

-- 기존 ER-Diagram에서 SCHEDULE 엔티티의 Date Attribute 中 Start_time과 End_time만 사용
-- Category Attribute 보류, 
CREATE TABLE SCHEDULE(
	Schedule_id		NUMBER		NOT NULL, -- Primary Key
	Title			VARCHAR2(40)	NOT NULL,
	Start_time		TIMESTAMP		NOT NULL,
	End_time		TIMESTAMP		NOT NULL,
	Student_id   	CHAR(10)		NOT NULL,	-- Foreign Key
	PRIMARY KEY (Schedule_id)
);

-- 기존 ER-Diagram에서 GROUP 엔티티의 Member Attribute를 테이블로 분리
-- Name을 가독성과 참조성을 위해 G_Name으로 변경
CREATE TABLE STUDENT_GROUP(
	Group_id			NUMBER		NOT NULL, -- Primary Key
	G_Name			VARCHAR2(40)	NOT NULL,
	Purpose			VARCHAR2(30),
	Leader			CHAR(10)		NOT NULL, -- Leaader Column에 STUDENT Table의 Student_id 값을 할당, 
	Member_Count		NUMBER		NOT NULL,
	PRIMARY KEY (Group_id)				
);

-- MEMBER Relation을 통해 GROUP 엔티티와 STUDENT 엔티티간의 Relationship(관계) 생성
CREATE TABLE MEMBER(
	Group_id			NUMBER		NOT NULL,	-- Foreign Key
	Student_id   		CHAR(10)		NOT NULL,	
	PRIMARY KEY (Group_id, Student_id)				-- Composite Primary Key
);

commit;

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

