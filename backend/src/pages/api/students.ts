import type { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../db"; // 경로 주의

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET 요청만 허용
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { type } = req.query;

  try {
    // 1. [Type 1] 학과별 학생 조회
    if (type === "by-dept") {
      const { deptId } = req.query;
      if (!deptId)
        return res.status(400).json({ error: "학과 코드가 필요합니다" });

      const sql = `SELECT student_id, name FROM student WHERE dept_id = :1`;
      const result = await executeQuery(sql, [deptId]);

      return res.status(200).json(result.rows);
    }

    // 3. [Type 3] 학기별 수강생 통계
    if (type === "course-stats") {
      const { term } = req.query; // 예: 202502

      const sql = `
        SELECT c.title, COUNT(t.student_id) as cnt
        FROM course c, section se, takes t
        WHERE c.course_id = se.course_id
          AND se.course_id = t.course_id
          AND se.section_id = t.section_id
          AND se.academic_term = :1
        GROUP BY c.title
        ORDER BY cnt DESC
      `;
      const result = await executeQuery(sql, [term]);

      return res.status(200).json(result.rows);
    }

    // 7. [Type 7] 인기 과목 조회
    if (type === "popular") {
      const minCount = req.query.minCount || 5;

      const sql = `
            SELECT title, student_count 
            FROM ( 
                SELECT c.title, COUNT(t.student_id) as student_count 
                FROM course c, section s, takes t 
                WHERE c.course_id = s.course_id 
                  AND s.course_id = t.course_id 
                  AND s.section_id = t.section_id 
                  AND s.academic_term = 202502 
                GROUP BY c.title 
            ) 
            WHERE student_count >= :1 
            ORDER BY student_count DESC
        `;
      const result = await executeQuery(sql, [minCount]);
      return res.status(200).json(result.rows);
    }

    return res.status(400).json({ error: "Invalid type" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Database Error" });
  }
}
