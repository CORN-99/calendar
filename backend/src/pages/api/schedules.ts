// backend/src/pages/api/schedules.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 우리는 POST만 사용
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "studentId 필요함" });
    }

    const sql = `
      SELECT
        SCHEDULE_ID,
        TITLE,
        START_TIME,
        END_TIME,
        STUDENT_ID
      FROM SCHEDULE
      WHERE STUDENT_ID = :1
      ORDER BY START_TIME
    `;

    const result = await executeQuery(sql, [studentId]);

    return res.status(200).json({
      message: "ok",
      schedules: result.rows,
    });
  } catch (err) {
    console.error("schedules api error:", err);
    return res
      .status(500)
      .json({ message: "서버 에러", error: String(err) });
  }
}