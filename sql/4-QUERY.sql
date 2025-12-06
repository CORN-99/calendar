-- TYPE 1: A single-table query => Selection + Projection
-- 컴퓨터학부('1O02') 학생들의 학번과 이름 검색
select student_id,
       name
  from student
 where dept_id = '1O02';

-- 2025년 10월에 시작하는 학사 일정의 제목 검색
select title
  from academic_event
 where start_date >= to_date('2025-10-01','YYYY-MM-DD')
   and start_date < to_date('2025-11-01','YYYY-MM-DD');


--------------------------------------------------
-- TYPE 2: Multi-way join with join predicates in WHERE
-- '공부' 목적으로 생성된 학생 그룹의 그룹명과 리더의 이름 검색
select sg.g_name as group_name,
       s.name as leader_name
  from student_group sg,
       student s
 where sg.leader = s.student_id
   and sg.purpose = '공부';

-- '컴퓨터학부'에서 주최하는 학과 행사의 제목과 장소 검색
select de.title as event_title,
       dl.location
  from department d,
       department_event de,
       dept_location dl
 where d.dept_id = de.department_id
   and de.dept_event_id = dl.dept_event_id
   and d.dept_name = '컴퓨터학부';


--------------------------------------------------
-- TYPE 3: Aggregation + multi-way join with join predicates + with GROUP BY
-- 2025년 2학기 과목별 수강 신청 학생 수 계산
select c.title,
       count(t.student_id) as takes_count
  from course c,
       section se,
       takes t
 where c.course_id = se.course_id
   and se.course_id = t.course_id
   and se.section_id = t.section_id
   and se.academic_term = 202502 -- 2025년 2학기 필터링
 group by c.title
 order by takes_count desc;

-- '컴퓨터학부' 학생이 리더인 그룹들의 목적별 평균 멤버 수 계산
select sg.purpose,
       avg(sg.member_count) as avg_member_count
  from student_group sg,
       student s
 where sg.leader = s.student_id
   and s.dept_id = '1O02' -- 컴퓨터학부 필터링
 group by sg.purpose
 order by avg_member_count desc;


--------------------------------------------------
-- Type 4: Subquery
-- 2025년 2학기에 가장 많은 학생이 수강하는 과목명 검색
select c.title
  from course c,
       section se,
       takes t
 where c.course_id = se.course_id
   and se.course_id = t.course_id
   and se.section_id = t.section_id
   and se.academic_term = 202502
 group by c.title
having count(t.student_id) = (
   select max(takes_count)
     from (
      select count(t_sub.student_id) as takes_count
        from section se_sub,
             takes t_sub
       where se_sub.course_id = t_sub.course_id
         and se_sub.section_id = t_sub.section_id
         and se_sub.academic_term = 202502
       group by t_sub.course_id
   )
);

--'컴퓨터학부' 학생이 리더인 그룹 중 멤버 수가 가장 많은 그룹명 검색 (멤버 수 다 같아서 다 나옴 ㅋㅋ)
select sg.g_name
  from student_group sg,
       student s
 where sg.leader = s.student_id
   and s.dept_id = '1O02' -- 컴퓨터학부 필터링
   and sg.member_count = (
   select max(sg_sub.member_count)
     from student_group sg_sub,
          student s_sub
    where sg_sub.leader = s_sub.student_id
      and s_sub.dept_id = '1O02'
);

-- '자료구조'(COME0331)를 수강하면서 '운영체제'(COMP0312)도 수강하는 학생의 이름 검색 (없음)
select s.name
  from student s,
       takes t
 where s.student_id = t.student_id
   and t.course_id = 'COME0331' -- 자료구조 과목번호
   and t.student_id in (
   select t_sub.student_id
     from takes t_sub
    where t_sub.course_id = 'COMP0312' -- 운영체제 과목번호
);


--------------------------------------------------
-- Type 5: EXISTS를 포함하는 Subquery
-- 2025년 2학기에 개설된 과목을 하나라도 수강하는 학생의 이름 검색
select s.name
  from student s
 where exists (
   select 1
     from takes t,
          section se
    where t.student_id = s.student_id
      and t.course_id = se.course_id
      and t.section_id = se.section_id
      and se.academic_term = 202502 -- 2025년 2학기 필터링
);

-- 개인 일정이 하나라도 등록되어 있는 학생의 이름 검색
select s.name
  from student s
 where exists (
   select 1
     from schedule sc
    where sc.student_id = s.student_id
);

-- 하나 이상의 그룹에 속해있는 학생의 이름 검색
select s.name
  from student s
 where exists (
   select 1
     from member m
    where m.student_id = s.student_id
);


--------------------------------------------------
-- Type 6: Selection + Projection + IN predicates
-- 과목 코드가 'COME0331', 'COMP0312', 'COMP0322' 중 하나인 과목의 과목명과 학점 검색
select title,
       credits
  from course
 where course_id in ( 'COME0331',
                      'COMP0312',
                      'COMP0322' );

-- 그룹 ID가 10, 20, 30인 그룹의 리더(학생) 이름 검색
select name
  from student
 where student_id in (
   select leader
     from student_group
    where group_id in ( 10,
                        20,
                        30 )
);


--------------------------------------------------
-- Type 7: In-line view를 활용한 Query (TPC-H Q9)
-- COURSE별 SECTION 갯수 계산 및 상위 5개 COURSE 표시
select *
  from (
   select course_id,
          count(*) as section_count
     from section
    group by course_id
) coursesectioncount
 order by section_count desc
 fetch first 5 rows only;


-- 2025년 2학기 수강생 수가 5명 이상인 과목의 이름과 수강생 수 계산
select title,
       student_count
  from (
   select c.title,
          count(t.student_id) as student_count
     from course c,
          section s,
          takes t
    where c.course_id = s.course_id
      and s.course_id = t.course_id
      and s.section_id = t.section_id
      and s.academic_term = 202502
    group by c.title
) coursestudentcount
 where student_count >= 5;


--------------------------------------------------
-- Type 8: Multi-way join with join predicates in WHERE + ORDER BY
-- 2025년 2학기 컴퓨터학부 학생들의 수강 과목 및 분반 정보 검색 (학생 이름, 과목명 순 정렬)
select s.name as student_name,
       c.title as course_title,
       se.section_id,
       se.time,
       se.location
  from student s,
       takes t,
       section se,
       course c
 where s.student_id = t.student_id
   and t.course_id = se.course_id
   and t.section_id = se.section_id
   and se.course_id = c.course_id
   and s.dept_id = '1O02' -- 컴퓨터학부 필터링
   and se.academic_term = 202502 -- 2025년 2학기 필터링
 order by s.name,
          c.title;

-- 모든 학생 그룹의 정보와 해당 그룹 리더의 이름 및 학과명 검색 (그룹 ID 순 정렬)
select sg.group_id,
       sg.g_name,
       sg.purpose,
       s.name as leader_name,
       d.dept_name as leader_dept
  from student_group sg,
       student s,
       department d
 where sg.leader = s.student_id
   and s.dept_id = d.dept_id
 order by sg.group_id;

-- 2025년 5월에 열리는 모든 학과 행사의 정보 (학과명, 행사명, 시작일, 장소) 검색 (시작일 순 정렬)
select d.dept_name as department_name,
       de.title as event_title,
       de.start_date,
       dl.location
  from department d,
       department_event de,
       dept_location dl
 where d.dept_id = de.department_id
   and de.dept_event_id = dl.dept_event_id
   and de.start_date >= to_date('2025-05-01','YYYY-MM-DD')
   and de.start_date < to_date('2025-06-01','YYYY-MM-DD')
 order by de.start_date;


--------------------------------------------------
-- Type 9: Aggregation + multi-way join with join predicates + with GROUP BY + ORDER BY
-- 2025년 2학기 각 분반별 수강 학생 수 계산 (수강생 많은 순 정렬)
select se.course_id,
       se.section_id,
       count(t.student_id) as student_count
  from section se,
       takes t
 where se.course_id = t.course_id
   and se.section_id = t.section_id
   and se.academic_term = 202502 -- 2025년 2학기 필터링
 group by se.course_id,
          se.section_id
 order by student_count desc;

-- 학생별 2025년 2학기 총 수강 학점 계산 (학점 높은 순 정렬)
select s.name,
       sum(c.credits) as total_credits
  from student s,
       takes t,
       section se,
       course c
 where s.student_id = t.student_id
   and t.course_id = se.course_id
   and t.section_id = se.section_id
   and se.course_id = c.course_id
   and se.academic_term = 202502 -- 2025년 2학기 필터링
 group by s.name
 order by total_credits desc;


--------------------------------------------------
-- Type 10: SET operation (UNION, SET DIFFERENCE, INTERSECT 등 중 하나)를 활용한 query
-- '자료구조'(COME0331) 과목 또는 '운영체제'(COMP0312) 과목을 수강하는 학생의 이름 검색
select s.name
  from student s
  join takes t
on s.student_id = t.student_id
 where t.course_id = 'COME0331' -- 자료구조
union
select s.name
  from student s
  join takes t
on s.student_id = t.student_id
 where t.course_id = 'COMP0312'; -- 운영체제

-- '자료구조'(COME0331)를 수강했지만 '알고리즘1'(COMP0319)은 수강하지 않은 학생의 이름 검색 (MINUS)
select s.name
  from student s
  join takes t
on s.student_id = t.student_id
 where t.course_id = 'COME0331'
minus
select s.name
  from student s
  join takes t
on s.student_id = t.student_id
 where t.course_id = 'COMP0319';

-- '자료구조'(COME0331) 과목과 '운영체제'(COMP0312) 과목을 모두 수강하는 학생의 이름 검색
select s.name
  from student s
  join takes t
on s.student_id = t.student_id
 where t.course_id = 'COME0331' -- 자료구조
intersect
select s.name
  from student s
  join takes t
on s.student_id = t.student_id
 where t.course_id = 'COMP0312'; -- 운영체제