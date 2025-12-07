import oracledb from "oracledb";
import dotenv from "dotenv";

dotenv.config();

try {
  oracledb.initOracleClient({ libDir: undefined });
} catch (err) {
  console.error("Oracle Client init error: ", err);
  process.exit(1);
}

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
};

// 👇 여기 맨 앞에 'export'가 있는지 꼭 확인하세요!
export async function getConnection() {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    return connection;
  } catch (err) {
    console.error("DB 연결 실패:", err);
    throw err;
  }
}
