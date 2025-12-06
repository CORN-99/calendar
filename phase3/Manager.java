package org.example.calendar;

import java.sql.*;
import java.util.Scanner;

public class Manager {
    private Connection conn;
    private Scanner scanner;

    // 생성자: Main에서 연결 객체와 스캐너를 받아옵니다.
    public Manager(Connection conn, Scanner scanner) {
        this.conn = conn;
        this.scanner = scanner;
    }

    // 자원 해제용 유틸리티 메소드
    private void close(Statement stmt, ResultSet rs) {
        try {
            if (rs != null) rs.close();
            if (stmt != null) stmt.close();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // =======================================================
    // 1. [Type 1] 학과별 학생 명단 조회
    // =======================================================
    public void queryStudentByDept() {
        System.out.println("\n--- [Type 1] 학과별 학생 조회 ---");
        System.out.print("검색할 학과 코드를 입력하세요 (예: 1O02): ");
        String deptId = scanner.nextLine();

        String sql = "SELECT student_id, name FROM student WHERE dept_id = ?";

        PreparedStatement pstmt = null;
        ResultSet rs = null;

        try {
            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, deptId);
            rs = pstmt.executeQuery();

            System.out.println("\n<검색 결과>");
            System.out.printf("%-15s %-15s\n", "학번", "이름");
            System.out.println("------------------------------");

            boolean found = false;
            while (rs.next()) {
                found = true;
                System.out.printf("%-15s %-15s\n", rs.getString("student_id"), rs.getString("name"));
            }
            if (!found) System.out.println("해당 학과의 학생이 없습니다.");

        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            close(pstmt, rs);
        }
    }

    // =======================================================
    // 2. [Type 2] 스터디 그룹 검색 (목적별)
    // =======================================================
    public void queryGroupByPurpose() {
        System.out.println("\n--- [Type 2] 스터디 그룹 검색 ---");
        System.out.print("검색할 그룹 목적을 입력하세요 (예: 공부, 취미): ");
        String purpose = scanner.nextLine();

        String sql = "SELECT sg.g_name, s.name " +
                "FROM student_group sg, student s " +
                "WHERE sg.leader = s.student_id AND sg.purpose = ?";

        PreparedStatement pstmt = null;
        ResultSet rs = null;

        try {
            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, purpose);
            rs = pstmt.executeQuery();

            System.out.println("\n<검색 결과>");
            System.out.printf("%-30s %-15s\n", "그룹명", "리더 이름");
            System.out.println("-----------------------------------------------");

            while (rs.next()) {
                System.out.printf("%-30s %-15s\n", rs.getString("g_name"), rs.getString("name"));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            close(pstmt, rs);
        }
    }

    // =======================================================
    // 3. [Type 3] 학기별 과목 수강생 통계
    // =======================================================
    public void queryCourseStatsByTerm() {
        System.out.println("\n--- [Type 3] 학기별 수강생 통계 ---");
        System.out.print("조회할 학기를 입력하세요 (숫자, 예: 202502): ");
        String termStr = scanner.nextLine();
        int term = 0;
        try {
            term = Integer.parseInt(termStr);
        } catch (NumberFormatException e) {
            System.out.println("잘못된 입력입니다.");
            return;
        }

        String sql = "SELECT c.title, COUNT(t.student_id) as cnt " +
                "FROM course c, section se, takes t " +
                "WHERE c.course_id = se.course_id " +
                "AND se.course_id = t.course_id " +
                "AND se.section_id = t.section_id " +
                "AND se.academic_term = ? " +
                "GROUP BY c.title " +
                "ORDER BY cnt DESC";

        PreparedStatement pstmt = null;
        ResultSet rs = null;

        try {
            pstmt = conn.prepareStatement(sql);
            pstmt.setInt(1, term);
            rs = pstmt.executeQuery();

            System.out.println("\n<수강생 수 통계>");
            System.out.printf("%-30s %-10s\n", "과목명", "수강인원");
            System.out.println("----------------------------------------");
            while (rs.next()) {
                System.out.printf("%-30s %-10d\n", rs.getString("title"), rs.getInt("cnt"));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            close(pstmt, rs);
        }
    }

    // =======================================================
    // 4. [Type 4] 동시 수강 학생 검색 (Subquery)
    // =======================================================
    public void queryStudentsTakingTwoCourses() {
        System.out.println("\n--- [Type 4] 동시 수강 학생 검색 ---");
        System.out.print("첫 번째 과목 코드를 입력하세요 (예: CAIB0211): ");
        String c1 = scanner.nextLine();
        System.out.print("두 번째 과목 코드를 입력하세요 (예: COME0368): ");
        String c2 = scanner.nextLine();

        String sql = "SELECT s.name " +
                "FROM student s, takes t " +
                "WHERE s.student_id = t.student_id " +
                "AND t.course_id = ? " +
                "AND t.student_id IN ( " +
                "    SELECT t_sub.student_id " +
                "    FROM takes t_sub " +
                "    WHERE t_sub.course_id = ? " +
                ")";

        PreparedStatement pstmt = null;
        ResultSet rs = null;

        try {
            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, c1);
            pstmt.setString(2, c2);
            rs = pstmt.executeQuery();

            System.out.println("\n<동시 수강 학생 명단>");
            while (rs.next()) {
                System.out.println("- " + rs.getString("name"));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            close(pstmt, rs);
        }
    }

    // =======================================================
    // 5. [Type 5] 개인 일정 보유 학생 조회 (EXISTS)
    // =======================================================
    public void queryStudentsWithSchedule() {
        System.out.println("\n--- [Type 5] 일정 보유 학생 조회 ---");
        System.out.print("특정 학번을 조회하려면 입력하세요 (전체 조회는 엔터): ");
        String studentId = scanner.nextLine();

        String sql = "SELECT s.name, s.student_id " +
                "FROM student s " +
                "WHERE EXISTS ( " +
                "    SELECT 1 FROM schedule sc WHERE sc.student_id = s.student_id " +
                ")";

        if (!studentId.isEmpty()) {
            sql += " AND s.student_id = ?";
        }

        PreparedStatement pstmt = null;
        ResultSet rs = null;

        try {
            pstmt = conn.prepareStatement(sql);
            if (!studentId.isEmpty()) {
                pstmt.setString(1, studentId);
            }
            rs = pstmt.executeQuery();

            System.out.println("\n<일정 보유 학생 명단>");
            System.out.printf("%-15s %-15s\n", "학번", "이름");
            System.out.println("------------------------------");
            int count = 0;
            while (rs.next()) {
                System.out.printf("%-15s %-15s\n", rs.getString("student_id"), rs.getString("name"));
                count++;
            }
            System.out.println("------------------------------");
            System.out.println("총 " + count + "명");

        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            close(pstmt, rs);
        }
    }

    // =======================================================
    // 6. [Type 6] 관심 과목 3개 정보 조회 (IN)
    // =======================================================
    public void querySelectedCoursesInfo() {
        System.out.println("\n--- [Type 6] 관심 과목 정보 조회 ---");
        System.out.print("과목 1 코드 (예:ELEC0475): ");
        String c1 = scanner.nextLine();
        System.out.print("과목 2 코드 (예:ELEC0331): ");
        String c2 = scanner.nextLine();
        System.out.print("과목 3 코드 (예:COMP0461): ");
        String c3 = scanner.nextLine();

        String sql = "SELECT title, credits FROM course WHERE course_id IN (?, ?, ?)";

        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, c1);
            pstmt.setString(2, c2);
            pstmt.setString(3, c3);
            rs = pstmt.executeQuery();

            System.out.println("\n<과목 정보>");
            System.out.printf("%-30s %-5s\n", "과목명", "학점");
            System.out.println("-------------------------------------");
            while (rs.next()) {
                System.out.printf("%-30s %-5d\n", rs.getString("title"), rs.getInt("credits"));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            close(pstmt, rs);
        }
    }

    // =======================================================
    // 7. [Type 7] 인기 과목 조회 (Inline View)
    // =======================================================
    public void queryPopularCourses() {
        System.out.println("\n--- [Type 7] 인기 과목 조회 ---");
        System.out.print("최소 수강 인원을 입력하세요 (예: 5): ");
        int minCount = Integer.parseInt(scanner.nextLine());

        String sql = "SELECT title, student_count " +
                "FROM ( " +
                "   SELECT c.title, COUNT(t.student_id) as student_count " +
                "   FROM course c, section s, takes t " +
                "   WHERE c.course_id = s.course_id " +
                "     AND s.course_id = t.course_id " +
                "     AND s.section_id = t.section_id " +
                "     AND s.academic_term = 202502 " +
                "   GROUP BY c.title " +
                ") " +
                "WHERE student_count >= ? " +
                "ORDER BY student_count DESC";

        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            pstmt = conn.prepareStatement(sql);
            pstmt.setInt(1, minCount);
            rs = pstmt.executeQuery();

            System.out.println("\n<인기 과목 리스트>");
            System.out.printf("%-30s %-10s\n", "과목명", "수강생 수");
            System.out.println("------------------------------------------");
            while (rs.next()) {
                System.out.printf("%-30s %-10d\n", rs.getString("title"), rs.getInt("student_count"));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            close(pstmt, rs);
        }
    }

    // =======================================================
    // 8. [Type 8] 월별 학과 행사 조회 (Join + Order By)
    // =======================================================
    public void queryDeptEventsByMonth() {
        System.out.println("\n--- [Type 8] 월별 학과 행사 조회 ---");
        System.out.print("조회할 연도와 월을 입력하세요 (예: 2025-05): ");
        String dateInput = scanner.nextLine();
        String startDateStr = dateInput + "-01";

        String sql = "SELECT d.dept_name, de.title, de.start_date, dl.location " +
                "FROM department d, department_event de, dept_location dl " +
                "WHERE d.dept_id = de.department_id " +
                "  AND de.dept_event_id = dl.dept_event_id " +
                "  AND de.start_date >= TO_DATE(?, 'YYYY-MM-DD') " +
                "  AND de.start_date < ADD_MONTHS(TO_DATE(?, 'YYYY-MM-DD'), 1) " +
                "ORDER BY de.start_date";

        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, startDateStr);
            pstmt.setString(2, startDateStr);
            rs = pstmt.executeQuery();

            System.out.println("\n<행사 일정>");
            System.out.printf("%-15s %-40s %-12s %-20s\n", "학과", "행사명", "시작일", "장소");
            System.out.println("--------------------------------------------------------------------------------");
            while (rs.next()) {
                System.out.printf("%-15s %-40s %-12s %-20s\n", rs.getString("dept_name"), rs.getString("title"), rs.getDate("start_date"), rs.getString("location"));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            close(pstmt, rs);
        }
    }

    // =======================================================
    // 9-1. [Type 9] 분반별 수강 인원 순위
    // =======================================================
    public void querySectionEnrollmentRanking() {
        System.out.println("\n--- [Type 9] 분반별 수강 인원 순위 ---");
        String sql = "SELECT se.course_id, se.section_id, COUNT(t.student_id) as student_count " +
                "FROM section se, takes t " +
                "WHERE se.course_id = t.course_id AND se.section_id = t.section_id AND se.academic_term = 202502 " +
                "GROUP BY se.course_id, se.section_id ORDER BY student_count DESC";

        try (Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(sql)) {
            System.out.printf("%-15s %-10s %-10s\n", "과목코드", "분반", "인원수");
            System.out.println("--------------------------------------");
            while (rs.next()) {
                System.out.printf("%-15s %-10s %-10d\n", rs.getString("course_id"), rs.getString("section_id"), rs.getInt("student_count"));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // =======================================================
    // 9-2. [Type 9] 학생별 총 수강 학점 순위
    // =======================================================
    public void queryStudentCreditRanking() {
        System.out.println("\n--- [Type 9] 학생별 총 수강 학점 순위 (Top 20) ---");
        String sql = "SELECT s.name, SUM(c.credits) as total_credits " +
                "FROM student s, takes t, section se, course c " +
                "WHERE s.student_id = t.student_id AND t.course_id = se.course_id AND t.section_id = se.section_id " +
                "AND se.course_id = c.course_id AND se.academic_term = 202502 " +
                "GROUP BY s.name ORDER BY total_credits DESC FETCH FIRST 20 ROWS ONLY";

        try (Statement stmt = conn.createStatement(); ResultSet rs = stmt.executeQuery(sql)) {
            System.out.printf("%-15s %-10s\n", "이름", "총학점");
            System.out.println("-------------------------");
            while (rs.next()) {
                System.out.printf("%-15s %-10d\n", rs.getString("name"), rs.getInt("total_credits"));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // =======================================================
    // 10-1. [Type 10] UNION
    // =======================================================
    public void queryUnionTakes() {
        System.out.println("\n--- [Type 10] UNION: A 또는 B 과목 수강생 ---");
        System.out.print("과목 A 코드 (예: CLTR0045) : ");
        String cA = scanner.nextLine();
        System.out.print("과목 B 코드 (예: COME0301): ");
        String cB = scanner.nextLine();

        String sql = "SELECT s.name FROM student s JOIN takes t ON s.student_id = t.student_id WHERE t.course_id = ? " +
                "UNION " +
                "SELECT s.name FROM student s JOIN takes t ON s.student_id = t.student_id WHERE t.course_id = ?";

        executeSetOpQuery(sql, cA, cB);
    }

    // =======================================================
    // 10-2. [Type 10] MINUS
    // =======================================================
    public void queryMinusTakes() {
        System.out.println("\n--- [Type 10] MINUS: A 수강, B 미수강 ---");
        System.out.print("과목 A 코드 (예: CLTR0045) : ");
        String cA = scanner.nextLine();
        System.out.print("과목 B 코드 (예: COME0301): ");
        String cB = scanner.nextLine();

        String sql = "SELECT s.name FROM student s JOIN takes t ON s.student_id = t.student_id WHERE t.course_id = ? " +
                "MINUS " +
                "SELECT s.name FROM student s JOIN takes t ON s.student_id = t.student_id WHERE t.course_id = ?";

        executeSetOpQuery(sql, cA, cB);
    }

    // =======================================================
    // 10-3. [Type 10] INTERSECT
    // =======================================================
    public void queryIntersectTakes() {
        System.out.println("\n--- [Type 10] INTERSECT: A와 B 모두 수강 ---");
        System.out.print("과목 A 코드 (예: CLTR0045) : ");
        String cA = scanner.nextLine();
        System.out.print("과목 B 코드 (예: COME0301): ");
        String cB = scanner.nextLine();

        String sql = "SELECT s.name FROM student s JOIN takes t ON s.student_id = t.student_id WHERE t.course_id = ? " +
                "INTERSECT " +
                "SELECT s.name FROM student s JOIN takes t ON s.student_id = t.student_id WHERE t.course_id = ?";

        executeSetOpQuery(sql, cA, cB);
    }

    // 집합 연산 쿼리 실행 헬퍼 메소드
    private void executeSetOpQuery(String sql, String param1, String param2) {
        PreparedStatement pstmt = null;
        ResultSet rs = null;
        try {
            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, param1);
            pstmt.setString(2, param2);
            rs = pstmt.executeQuery();
            System.out.println("\n<결과 명단>");
            while (rs.next()) System.out.println("- " + rs.getString("name"));
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            close(pstmt, rs);
        }
    }


    // =======================================================
    // 14. [DML] 개인 일정 관리
    // =======================================================
    public void managePersonalSchedule() {
        System.out.println("\n[개인 일정 관리]");
        System.out.println("1. 일정 등록  2. 일정 수정  3. 일정 삭제");
        System.out.print("선택>> ");
        String choice = scanner.nextLine();

        switch (choice) {
            case "1":
                insertSchedule();
                break;
            case "2":
                updateSchedule();
                break;
            case "3":
                deleteSchedule();
                break;
            default:
                System.out.println("잘못된 선택입니다.");
        }
    }

    private void insertSchedule() {
        System.out.println("=== 일정 등록 ===");
        System.out.print("학번 (예: 2022000074): ");
        String sid = scanner.nextLine();
        System.out.print("제목: ");
        String title = scanner.nextLine();
        System.out.print("시작(YYYY-MM-DD HH:MI): ");
        String start = scanner.nextLine();
        System.out.print("종료(YYYY-MM-DD HH:MI): ");
        String end = scanner.nextLine();

        String sql = "INSERT INTO schedule (schedule_id, student_id, title, start_time, end_time) " +
                "VALUES ((SELECT NVL(MAX(schedule_id), 0) + 1 FROM schedule), ?, ?, TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI'), TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI'))";

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, sid);
            pstmt.setString(2, title);
            pstmt.setString(3, start);
            pstmt.setString(4, end);
            if (pstmt.executeUpdate() > 0) {
                System.out.println("Success! 등록 성공!");
                conn.commit();
            } else System.out.println("Fail! 등록 실패");
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    // 1-2. 일정 수정 (UPDATE) - 제목, 시작시간, 종료시간 변경 가능 (입력 없으면 유지)
    private void updateSchedule() {
        System.out.println("=== 일정 수정 ===");
        System.out.print("수정할 일정 ID 입력: ");
        String idStr = scanner.nextLine();
        if (idStr.trim().isEmpty()) {
            System.out.println("ID가 입력되지 않았습니다.");
            return;
        }
        int scheduleId = Integer.parseInt(idStr);

        // 1. 기존 데이터 조회 (현재 값을 알기 위해 SELECT 먼저 수행)
        // Oracle의 TO_CHAR 함수를 사용하여 시간 포맷을 문자열로 가져옵니다.
        String selectSql = "SELECT title, " +
                "TO_CHAR(start_time, 'YYYY-MM-DD HH24:MI') as start_str, " +
                "TO_CHAR(end_time, 'YYYY-MM-DD HH24:MI') as end_str " +
                "FROM schedule WHERE schedule_id = ?";

        String currentTitle = "";
        String currentStart = "";
        String currentEnd = "";

        PreparedStatement pstmtSelect = null;
        ResultSet rs = null;

        try {
            pstmtSelect = conn.prepareStatement(selectSql);
            pstmtSelect.setInt(1, scheduleId);
            rs = pstmtSelect.executeQuery();

            if (rs.next()) {
                currentTitle = rs.getString("title");
                currentStart = rs.getString("start_str");
                currentEnd = rs.getString("end_str");
            } else {
                System.out.println("Fail! 해당 ID의 일정을 찾을 수 없습니다.");
                return; // 메소드 종료
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return;
        } finally {
            // Select 관련 자원 해제 (Connection은 유지)
            try {
                if (rs != null) rs.close();
                if (pstmtSelect != null) pstmtSelect.close();
            } catch (SQLException e) {
            }
        }

        // 2. 사용자 입력 받기 (빈 값이면 기존 값 유지)
        System.out.println(">> 수정할 값을 입력하세요 (변경하지 않으려면 Enter 키를 누르세요)");

        System.out.print("새 제목 [" + currentTitle + "]: ");
        String newTitle = scanner.nextLine();
        if (newTitle.trim().isEmpty()) newTitle = currentTitle;

        System.out.print("새 시작 시간 [" + currentStart + "]: ");
        String newStart = scanner.nextLine();
        if (newStart.trim().isEmpty()) newStart = currentStart;

        System.out.print("새 종료 시간 [" + currentEnd + "]: ");
        String newEnd = scanner.nextLine();
        if (newEnd.trim().isEmpty()) newEnd = currentEnd;

        // 3. 데이터 업데이트 (UPDATE)
        String updateSql = "UPDATE schedule SET title = ?, " +
                "start_time = TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI'), " +
                "end_time = TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI') " +
                "WHERE schedule_id = ?";

        try (PreparedStatement pstmtUpdate = conn.prepareStatement(updateSql)) {
            pstmtUpdate.setString(1, newTitle);
            pstmtUpdate.setString(2, newStart);
            pstmtUpdate.setString(3, newEnd);
            pstmtUpdate.setInt(4, scheduleId);

            int rows = pstmtUpdate.executeUpdate();
            if (rows > 0) {
                System.out.println("Success! 일정이 성공적으로 수정되었습니다.");
                conn.commit();
            } else {
                System.out.println("Fail! 수정 실패.");
            }
        } catch (SQLException e) {
            e.printStackTrace();
            try {
                conn.rollback();
            } catch (SQLException ex) {
            }
        }
    }

    private void deleteSchedule() {
        System.out.print("삭제할 일정 ID: ");
        int id = Integer.parseInt(scanner.nextLine());
        String sql = "DELETE FROM schedule WHERE schedule_id = ?";
        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, id);
            if (pstmt.executeUpdate() > 0) {
                System.out.println("Success! 삭제 성공!");
                conn.commit();
            } else System.out.println("Fail! 삭제 실패 (ID 확인)");
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }


    // =======================================================
    // 15. [DML] 스터디 그룹 관리
    // =======================================================
    public void manageStudentGroup() {
        System.out.println("\n[스터디 그룹 관리]");
        System.out.println("1. 그룹 생성  2. 리더 변경");
        System.out.print("선택>> ");
        String choice = scanner.nextLine();
        if (choice.equals("1")) createGroup();
        else if (choice.equals("2")) updateGroupLeader();
    }

    private void createGroup() {
        System.out.println("=== 그룹 생성 ===");
        System.out.print("그룹명: ");
        String gName = scanner.nextLine();
        System.out.print("목적: ");
        String purpose = scanner.nextLine();
        System.out.print("리더 학번: ");
        String leader = scanner.nextLine();

        String sql = "INSERT INTO student_group (group_id, g_name, purpose, leader, member_count) " +
                "VALUES ((SELECT NVL(MAX(group_id), 0) + 1 FROM student_group), ?, ?, ?, 1)";

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, gName);
            pstmt.setString(2, purpose);
            pstmt.setString(3, leader);
            if (pstmt.executeUpdate() > 0) {
                System.out.println("Success! 생성 성공!");
                conn.commit();
            } else System.out.println("Fail! 생성 실패");
        } catch (SQLException e) {
            System.out.println("오류: " + e.getMessage());
        }
    }

    private void updateGroupLeader() {
        System.out.print("그룹 ID (예: 184): ");
        int gid = Integer.parseInt(scanner.nextLine());
        System.out.print("새 리더 학번 (예: 2022000037) : ");
        String lid = scanner.nextLine();
        String sql = "UPDATE student_group SET leader = ? WHERE group_id = ?";
        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, lid);
            pstmt.setInt(2, gid);
            if (pstmt.executeUpdate() > 0) {
                System.out.println("Success! 변경 성공!");
                conn.commit();
            } else System.out.println("Fail! 변경 실패");
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}