// src/db.ts
import oracledb from "oracledb";
import dotenv from "dotenv";

dotenv.config();

// 오라클 초기화 (한 번만 실행되도록 전역 체크)
if (!oracledb.initOracleClient) {
  try {
    oracledb.initOracleClient({ libDir: undefined });
  } catch (err) {
    console.error("Oracle Client init error: ", err);
  }
}

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
};

export async function getConnection() {
  return await oracledb.getConnection(dbConfig);
}

// 헬퍼 함수: 연결 -> 실행 -> 결과반환 -> 연결해제
export async function executeQuery(
  sql: string,
  binds: any[] = [],
  options: oracledb.ExecuteOptions = {}
) {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT, // 결과를 객체로 받기
      ...options,
    });
    return result;
  } catch (err) {
    console.error("Query Error:", err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (e) {
        console.error(e);
      }
    }
  }
}
