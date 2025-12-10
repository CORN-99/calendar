import type { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const method = req.method;

  try {
    switch (method) {
      // 1. 일정 조회 (GET)
      case "GET": {
        const { studentId } = req.query;
        let sql = `
            SELECT s.name, s.student_id 
            FROM student s 
            WHERE EXISTS ( 
                SELECT 1 FROM schedule sc WHERE sc.student_id = s.student_id 
            )
        `;
        const binds = [];
        if (studentId) {
          sql += " AND s.student_id = :1";
          binds.push(studentId);
        }
        const result = await executeQuery(sql, binds);
        return res.status(200).json(result.rows);
      }

      // 2. 일정 등록 (POST)
      case "POST": {
        const { student_id, title, start_time, end_time } = req.body;

        // 수정 전 (에러 원인): VALUES (..., :sid, :title, ...)
        // 수정 후 (해결): VALUES (..., :1, :2, ...)
        // 배열 순서대로 [student_id, title, start_time, end_time] 이 1, 2, 3, 4번에 들어갑니다.
        const sql = `
      INSERT INTO schedule (schedule_id, student_id, title, start_time, end_time) 
      VALUES (
          (SELECT NVL(MAX(schedule_id), 0) + 1 FROM schedule), 
          :1, :2, 
          TO_TIMESTAMP(:3, 'YYYY-MM-DD HH24:MI'), 
          TO_TIMESTAMP(:4, 'YYYY-MM-DD HH24:MI')
      )
  `;

        await executeQuery(sql, [student_id, title, start_time, end_time], {
          autoCommit: true,
        });
        return res.status(201).json({ message: "등록 성공" });
      }

      // 3. 일정 수정 (PUT)
      case "PUT": {
        const { schedule_id, title, start_time, end_time } = req.body;

        const sql = `
      UPDATE schedule SET 
          title = :1, 
          start_time = TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI'), 
          end_time = TO_TIMESTAMP(:3, 'YYYY-MM-DD HH24:MI') 
      WHERE schedule_id = :4
  `;

        // 배열 순서 중요: [제목, 시작, 종료, 아이디] -> :1, :2, :3, :4
        await executeQuery(sql, [title, start_time, end_time, schedule_id], {
          autoCommit: true,
        });
        return res.status(200).json({ message: "수정 성공" });
      }

      // 4. 일정 삭제 (DELETE)
      case "DELETE": {
        const { id } = req.query; // DELETE는 보통 query string으로 ID를 받습니다.

        const sql = `DELETE FROM schedule WHERE schedule_id = :1`;
        await executeQuery(sql, [id], { autoCommit: true });
        return res.status(200).json({ message: "삭제 성공" });
      }

      default:
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Database Operation Failed" });
  }
}
