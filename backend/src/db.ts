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

/**
 * 트랜잭션을 지원하는 함수
 * 여러 쿼리를 하나의 트랜잭션으로 묶어 실행하고, 오류 발생 시 자동 롤백
 * 
 * @param callback 트랜잭션 내에서 실행할 함수 (connection 객체를 인자로 받음)
 * @param retries Deadlock 발생 시 재시도 횟수 (기본값: 3)
 * @returns callback의 반환값
 */
export async function executeTransaction<T>(
  callback: (connection: oracledb.Connection) => Promise<T>,
  retries: number = 3
): Promise<T> {
  let connection: oracledb.Connection | undefined;
  let attempt = 0;

  while (attempt < retries) {
    try {
      connection = await getConnection();
      
      // 트랜잭션 격리 수준 설정 (SERIALIZABLE: 가장 엄격한 격리 수준)
      // Oracle에서는 SET TRANSACTION을 사용하거나 생략 가능 (기본값 사용)
      try {
        await connection.execute(
          "SET TRANSACTION ISOLATION LEVEL SERIALIZABLE",
          [],
          { autoCommit: false }
        );
      } catch (isoErr: any) {
        // 일부 Oracle 버전에서는 지원하지 않을 수 있으므로 무시
        // 기본 격리 수준 사용
        console.log("Isolation level setting skipped:", isoErr.message);
      }

      // autoCommit을 false로 설정하여 트랜잭션 시작
      const result = await callback(connection);
      
      // 모든 작업이 성공하면 커밋
      await connection.commit();
      return result;
    } catch (err: any) {
      // 롤백 시도
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackErr) {
          console.error("Rollback Error:", rollbackErr);
        }
      }

      // Deadlock 에러 (ORA-00060)인 경우 재시도
      if (err.errorNum === 60 && attempt < retries - 1) {
        attempt++;
        const delay = Math.min(100 * Math.pow(2, attempt), 1000); // 지수 백오프
        console.log(`Deadlock detected, retrying... (attempt ${attempt}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // 다른 에러이거나 재시도 횟수 초과
      throw err;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (e) {
          console.error("Connection close error:", e);
        }
      }
    }
  }

  throw new Error("Transaction failed after all retries");
}

/**
 * SELECT FOR UPDATE를 사용한 비관적 잠금
 * 동시성 제어를 위해 특정 행을 잠금
 * 
 * @param sql SELECT 쿼리 (FOR UPDATE 절 포함)
 * @param binds 바인드 변수 배열
 * @param connection 트랜잭션 연결 객체
 * @returns 쿼리 결과
 */
export async function executeSelectForUpdate(
  sql: string,
  binds: any[],
  connection: oracledb.Connection
) {
  // FOR UPDATE 절이 없으면 추가
  const sqlWithLock = sql.trim().endsWith("FOR UPDATE") 
    ? sql 
    : `${sql} FOR UPDATE`;
  
  return await connection.execute(sqlWithLock, binds, {
    outFormat: oracledb.OUT_FORMAT_OBJECT,
  });
}
