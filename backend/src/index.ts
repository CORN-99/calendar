import { getConnection } from "./db";

async function testConnection() {
  let connection;

  try {
    // DB 연결 시도
    console.log("🔄 Oracle DB 연결 시도 중...");
    connection = await getConnection();
    console.log("✅ 오라클 데이터베이스 연결 성공!");
    console.log(`접속된 계정: ${process.env.DB_USER}`);
    console.log(`접속 주소: ${process.env.DB_CONNECT_STRING}`);

    // 간단한 쿼리 실행 (현재 시간 확인)
    const result = await connection.execute(
      `SELECT TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') as NOW FROM DUAL`
    );
    console.log("DB 현재 시간:", result.rows);
  } catch (err) {
    console.error("❌ 연결 에러:", err);
  } finally {
    // 연결 종료 (필수)
    if (connection) {
      try {
        await connection.close();
        console.log("🔒 DB 연결 안전하게 종료됨");
      } catch (err) {
        console.error(err);
      }
    }
  }
}

testConnection();
