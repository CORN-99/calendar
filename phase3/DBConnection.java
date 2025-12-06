package org.example.calendar;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBConnection {
    // DB 연결 정보
    private static final String URL = "jdbc:oracle:thin:@localhost:1521:xe";
    private static final String USER = "corn";
    private static final String PASSWD = "corn";

    // 연결 객체를 반환하는 메소드
    public static Connection getConnection() {
        Connection conn = null;
        try {
            // 필요하다면 드라이버 로드: Class.forName("oracle.jdbc.driver.OracleDriver");
            conn = DriverManager.getConnection(URL, USER, PASSWD);
            conn.setAutoCommit(false); // 트랜잭션 관리를 위해 AutoCommit 해제
            System.out.println(">> DB 연결 성공!");
        } catch (SQLException e) {
            System.out.println(">> DB 연결 실패: " + e.getMessage());
        }
        return conn;
    }

    // 자원 해제 (닫기) 메소드
    public static void close(Connection conn) {
        try {
            if (conn != null && !conn.isClosed()) {
                conn.close();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}