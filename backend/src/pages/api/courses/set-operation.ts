import type { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../../db"; // 경로가 3단계 위임에 주의

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { op, cA, cB } = req.query;

  if (!cA || !cB) {
    return res.status(400).json({ error: "두 과목 코드가 필요합니다" });
  }

  let operator = "";
  if (op === "union") operator = "UNION";
  else if (op === "minus") operator = "MINUS";
  else if (op === "intersect") operator = "INTERSECT";
  else return res.status(400).json({ error: "Invalid operator" });

  try {
    const sql = `
        SELECT s.name FROM student s JOIN takes t ON s.student_id = t.student_id WHERE t.course_id = :1
        ${operator}
        SELECT s.name FROM student s JOIN takes t ON s.student_id = t.student_id WHERE t.course_id = :2
    `;

    const result = await executeQuery(sql, [cA, cB]);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Database Error" });
  }
}
