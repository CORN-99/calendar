// backend/src/pages/api/courses.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POST만 허용
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
        t.STUDENT_ID,
        t.COURSE_ID,
        t.SECTION_ID
      FROM TAKES t
      WHERE t.STUDENT_ID = :1
      ORDER BY t.COURSE_ID, t.SECTION_ID
    `;

    const result = await executeQuery(sql, [studentId]);

    return res.status(200).json({
      message: "ok",
      courses: result.rows,
    });
  } catch (err) {
    console.error("courses api error:", err);
    return res
      .status(500)
      .json({ message: "서버 에러", error: String(err) });
  }
}