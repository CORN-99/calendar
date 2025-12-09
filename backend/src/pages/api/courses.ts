// backend/src/pages/api/courses.ts (예시)
import type { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ message: "studentId 필요함" });
  }

  const sql = `
    SELECT
      t.student_id,
      t.course_id,
      t.section_id,
      c.title,
      s.time
    FROM takes   t
    JOIN section s ON s.course_id = t.course_id AND s.section_id = t.section_id
    JOIN course  c ON c.course_id = t.course_id
    WHERE t.student_id = :1
      AND s.academic_term = 202502
  `;
  const result = await executeQuery(sql, [studentId]);

  return res.status(200).json({ courses: result.rows });
}