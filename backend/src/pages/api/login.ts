// src/pages/api/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ message: "학번이 필요합니다." });
  }

  try {
    const sql = `
      SELECT student_id, name, dept_id
      FROM STUDENT
      WHERE student_id = :id
    `;
    const result = await executeQuery(sql, [studentId]);
    const rows = (result as any).rows || [];

    if (rows.length === 0) {
      // STUDENT 테이블에 없는 학번
      return res.status(401).json({ message: "존재하지 않는 학번입니다." });
    }

    const user = rows[0];

    // 여기서는 간단히 user 정보만 내려줌 (토큰 같은 건 과제면 생략해도 무방)
    return res.status(200).json({
      message: "로그인 성공",
      user, // { STUDENT_ID: '...', NAME: '...', DEPT_ID: '...' } 이런 형태일 가능성 큼
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "서버 에러", error: String(err) });
  }
}