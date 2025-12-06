package org.example.calendar;

import java.sql.Connection;
import java.util.Scanner;

public class Phase3Main {
    public static void main(String[] args) {
        // 1. DB 연결 (DBConnection 클래스 사용)
        System.out.println("데이터베이스 연결을 시도합니다...");
        Connection conn = DBConnection.getConnection();
        Scanner scanner = new Scanner(System.in);

        if (conn == null) {
            System.out.println("DB 연결 실패. 프로그램을 종료합니다.");
            return;
        }

        // 2. 매니저 객체 생성 (연결 객체와 스캐너를 주입)
        Manager manager = new Manager(conn, scanner);

        boolean isRunning = true;
        while (isRunning) {
            printMenu(); // 메뉴 출력
            System.out.print("선택>> ");
            String input = scanner.nextLine();

            try {
                switch (input) {
                    // 조회 기능 (SELECT)
                    case "1":
                        manager.queryStudentByDept();
                        break;
                    case "2":
                        manager.queryGroupByPurpose();
                        break;
                    case "3":
                        manager.queryCourseStatsByTerm();
                        break;
                    case "4":
                        manager.queryStudentsTakingTwoCourses();
                        break;
                    case "5":
                        manager.queryStudentsWithSchedule();
                        break;
                    case "6":
                        manager.querySelectedCoursesInfo();
                        break;
                    case "7":
                        manager.queryPopularCourses();
                        break;
                    case "8":
                        manager.queryDeptEventsByMonth();
                        break;
                    case "9":
                        manager.querySectionEnrollmentRanking();
                        break;
                    case "10":
                        manager.queryStudentCreditRanking();
                        break;
                    case "11":
                        manager.queryUnionTakes();
                        break;
                    case "12":
                        manager.queryMinusTakes();
                        break;
                    case "13":
                        manager.queryIntersectTakes();
                        break;

                    // 데이터 조작 기능 (INSERT, UPDATE, DELETE)
                    case "14":
                        manager.managePersonalSchedule();
                        break;
                    case "15":
                        manager.manageStudentGroup();
                        break;

                    // 종료
                    case "0":
                        System.out.println("프로그램을 종료합니다.");
                        isRunning = false;
                        break;
                    default:
                        System.out.println("잘못된 입력입니다. 다시 선택해주세요.");
                }
            } catch (Exception e) {
                System.out.println("오류가 발생했습니다: " + e.getMessage());
                e.printStackTrace();
            }
            System.out.println(); // 줄바꿈으로 가독성 확보
        }

        // 3. 종료 시 자원 해제
        scanner.close();
        DBConnection.close(conn);
    }

    // 메인 메뉴 출력 메소드
    private static void printMenu() {
        System.out.println("=======================================================");
        System.out.println("           [Phase 3] 학사 일정 관리 시스템");
        System.out.println("=======================================================");
        System.out.println(" [조회 기능]");
        System.out.println(" 1. 학과별 학생 명단 조회 (Type 1)");
        System.out.println(" 2. 스터디 그룹 검색 (목적별) (Type 2)");
        System.out.println(" 3. 학기별 과목 수강생 통계 (Type 3)");
        System.out.println(" 4. 동시 수강 학생 검색 (Type 4)");
        System.out.println(" 5. 개인 일정 보유 학생 조회 (Type 5)");
        System.out.println(" 6. 관심 과목 3개 정보 조회 (Type 6)");
        System.out.println(" 7. 인기 과목 조회 (Type 7)");
        System.out.println(" 8. 월별 학과 행사 조회 (Type 8)");
        System.out.println(" 9. 분반별 수강 인원 순위 (Type 9)");
        System.out.println("10. 학생별 총 수강 학점 순위 (Type 9)");
        System.out.println("11. 과목 A 또는 B 수강생 (UNION) (Type 10)");
        System.out.println("12. 과목 A 수강, B 미수강 (MINUS) (Type 10)");
        System.out.println("13. 과목 A와 B 모두 수강 (INTERSECT) (Type 10)");
        System.out.println("-------------------------------------------------------");
        System.out.println(" [관리 기능 (DML)]");
        System.out.println("14. 개인 일정 관리 (등록/수정/삭제)");
        System.out.println("15. 스터디 그룹 관리 (생성/리더변경)");
        System.out.println("-------------------------------------------------------");
        System.out.println(" 0. 종료");
        System.out.println("=======================================================");
    }
}