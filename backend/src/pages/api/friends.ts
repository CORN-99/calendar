import type { NextApiRequest, NextApiResponse } from "next";
import { executeQuery, executeTransaction, executeSelectForUpdate } from "../../db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const method = req.method;

  try {
    // 1. 친구 목록 조회 (GET)
    if (method === "GET") {
      const { studentId } = req.query;
      if (!studentId) {
        return res.status(400).json({ error: "Student ID is required" });
      }

      // 내가 student_id1인 경우 (상대방은 student_id2)
      // 또는 내가 student_id2인 경우 (상대방은 student_id1)
      // 두 경우를 UNION 하여 상대방 정보를 가져옵니다.
      // DEPARTMENT 테이블과 JOIN하여 학과명도 함께 가져옵니다.
      const sql = `
        SELECT s.STUDENT_ID as "student_id", s.NAME as "name", s.DEPT_ID as "dept_id", d.DEPT_NAME as "dept_name"
        FROM STUDENT s
        JOIN FRIENDSHIP f ON s.STUDENT_ID = f.STUDENT_ID2
        JOIN DEPARTMENT d ON s.DEPT_ID = d.DEPT_ID
        WHERE f.STUDENT_ID1 = :1
        UNION
        SELECT s.STUDENT_ID as "student_id", s.NAME as "name", s.DEPT_ID as "dept_id", d.DEPT_NAME as "dept_name"
        FROM STUDENT s
        JOIN FRIENDSHIP f ON s.STUDENT_ID = f.STUDENT_ID1
        JOIN DEPARTMENT d ON s.DEPT_ID = d.DEPT_ID
        WHERE f.STUDENT_ID2 = :1
      `;

      const result = await executeQuery(sql, [studentId, studentId]);
      return res.status(200).json({ friends: result.rows });
    }

    // 2. 친구 추가 (POST) - 트랜잭션으로 동시성 제어
    if (method === "POST") {
      const { myId, friendId } = req.body;

      if (!myId || !friendId) {
        return res.status(400).json({ error: "Both IDs are required" });
      }

      if (myId === friendId) {
        return res.status(400).json({ error: "Cannot add yourself as a friend" });
      }

      // ID 정렬 (작은 값이 id1, 큰 값이 id2) - 항상 일관된 순서로 잠금
      const [id1, id2] = [myId, friendId].sort();

      await executeTransaction(async (connection) => {
        // 이미 친구인지 확인 (FOR UPDATE로 잠금)
        // Oracle 테이블 이름은 대문자로 저장되지만 따옴표 없이 사용하면 대소문자 무시
        const checkSql = `
          SELECT * 
          FROM FRIENDSHIP 
          WHERE STUDENT_ID1 = :1 AND STUDENT_ID2 = :2
        `;
        const checkResult = await executeSelectForUpdate(
          checkSql,
          [id1, id2],
          connection
        );

        if (checkResult.rows && checkResult.rows.length > 0) {
          throw new Error("Already friends");
        }

        const insertSql = `
          INSERT INTO FRIENDSHIP (STUDENT_ID1, STUDENT_ID2) 
          VALUES (:1, :2)
        `;
        await connection.execute(insertSql, [id1, id2], {
          autoCommit: false,
        });
      });

      return res.status(200).json({ message: "Friend added successfully" });
    }

    // 3. 친구 삭제 (DELETE) - 트랜잭션으로 동시성 제어
    if (method === "DELETE") {
      const { myId, friendId } = req.query;

      if (!myId || !friendId) {
        return res.status(400).json({ error: "Both IDs are required" });
      }

      // ID 정렬
      // req.query 값은 string | string[] 일 수 있으므로 형변환
      const sMyId = String(myId);
      const sFriendId = String(friendId);
      const [id1, id2] = [sMyId, sFriendId].sort();

      await executeTransaction(async (connection) => {
        // 친구 관계 존재 확인 및 잠금
        const checkSql = `
          SELECT * 
          FROM FRIENDSHIP 
          WHERE STUDENT_ID1 = :1 AND STUDENT_ID2 = :2
        `;
        const checkResult = await executeSelectForUpdate(
          checkSql,
          [id1, id2],
          connection
        );

        if (!checkResult.rows || checkResult.rows.length === 0) {
          throw new Error("Friendship not found");
        }

        const deleteSql = `
          DELETE FROM FRIENDSHIP 
          WHERE STUDENT_ID1 = :1 AND STUDENT_ID2 = :2
        `;
        await connection.execute(deleteSql, [id1, id2], {
          autoCommit: false,
        });
      });

      return res.status(200).json({ message: "Friend deleted successfully" });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error: any) {
    console.error("Friends API Error:", error);

    // Deadlock 에러 처리
    if (error.errorNum === 60) {
      return res.status(409).json({ 
        error: "동시 접속으로 인한 충돌이 발생했습니다. 잠시 후 다시 시도해주세요." 
      });
    }

    // Unique constraint violation (이미 친구인 경우)
    if (error.errorNum === 1) {
      return res.status(409).json({ error: "Already friends" });
    }

    // 커스텀 에러 메시지 처리
    if (error.message === "Already friends") {
      return res.status(409).json({ error: error.message });
    }
    if (error.message === "Friendship not found") {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ error: "Database Error" });
  }
}
