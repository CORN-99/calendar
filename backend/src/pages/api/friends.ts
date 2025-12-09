import type { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../db";

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
      // 두 경우를 UNION 하여 상대방 정보를 가져옴.
      const sql = `
        SELECT s.student_id, s.name, s.dept_id
        FROM student s
        JOIN friendship f ON s.student_id = f.student_id2
        WHERE f.student_id1 = :id
        UNION
        SELECT s.student_id, s.name, s.dept_id
        FROM student s
        JOIN friendship f ON s.student_id = f.student_id1
        WHERE f.student_id2 = :id
      `;

      const result = await executeQuery(sql, [studentId]);
      return res.status(200).json({ friends: result.rows });
    }

    // 2. 친구 추가 (POST)
    if (method === "POST") {
      const { myId, friendId } = req.body;

      if (!myId || !friendId) {
        return res.status(400).json({ error: "Both IDs are required" });
      }

      if (myId === friendId) {
        return res.status(400).json({ error: "Cannot add yourself as a friend" });
      }

      // ID 정렬 (작은 값이 id1, 큰 값이 id2)
      const [id1, id2] = [myId, friendId].sort();

      // 이미 친구인지 확인
      const checkSql = `SELECT * FROM friendship WHERE student_id1 = :1 AND student_id2 = :2`;
      const checkResult = await executeQuery(checkSql, [id1, id2]);

      if (checkResult.rows && checkResult.rows.length > 0) {
        return res.status(409).json({ error: "Already friends" });
      }

      const insertSql = `INSERT INTO friendship (student_id1, student_id2) VALUES (:1, :2)`;
      await executeQuery(insertSql, [id1, id2]);
      await executeQuery("COMMIT");

      return res.status(200).json({ message: "Friend added successfully" });
    }

    // 3. 친구 삭제 (DELETE)
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

      const deleteSql = `DELETE FROM friendship WHERE student_id1 = :1 AND student_id2 = :2`;
      await executeQuery(deleteSql, [id1, id2]);
      await executeQuery("COMMIT");

      return res.status(200).json({ message: "Friend deleted successfully" });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("Friends API Error:", error);
    return res.status(500).json({ error: "Database Error" });
  }
}
