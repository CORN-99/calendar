import type { NextApiRequest, NextApiResponse } from "next";
import { executeQuery, executeTransaction, executeSelectForUpdate } from "../../db";
import oracledb from "oracledb";

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

      // 2. 일정 등록 (POST) - 트랜잭션으로 동시성 제어
      case "POST": {
        const { student_id, title, start_time, end_time } = req.body;

        await executeTransaction(async (connection) => {
          // schedule_id 생성 시 동시성 제어를 위해 FOR UPDATE 사용
          const getMaxIdSql = `
            SELECT NVL(MAX(schedule_id), 0) AS max_id
            FROM schedule
          `;
          const maxIdResult = await executeSelectForUpdate(
            getMaxIdSql,
            [],
            connection
          );
          const maxId = (maxIdResult as any).rows[0]?.MAX_ID || 0;
          const newScheduleId = maxId + 1;

          const insertSql = `
            INSERT INTO schedule (schedule_id, student_id, title, start_time, end_time) 
            VALUES (
                :1, :2, :3, 
                TO_TIMESTAMP(:4, 'YYYY-MM-DD HH24:MI'), 
                TO_TIMESTAMP(:5, 'YYYY-MM-DD HH24:MI')
            )
          `;

          await connection.execute(
            insertSql,
            [newScheduleId, student_id, title, start_time, end_time],
            { autoCommit: false }
          );
        });

        return res.status(201).json({ message: "등록 성공" });
      }

      // 3. 일정 수정 (PUT) - 트랜잭션으로 동시성 제어
      case "PUT": {
        const { schedule_id, title, start_time, end_time } = req.body;

        await executeTransaction(async (connection) => {
          // 수정 전 일정 존재 확인 및 잠금
          const checkSql = `
            SELECT schedule_id, student_id
            FROM schedule
            WHERE schedule_id = :1
          `;
          const checkResult = await executeSelectForUpdate(
            checkSql,
            [schedule_id],
            connection
          );

          if (!checkResult.rows || checkResult.rows.length === 0) {
            throw new Error("일정을 찾을 수 없습니다.");
          }

          const updateSql = `
            UPDATE schedule SET 
                title = :1, 
                start_time = TO_TIMESTAMP(:2, 'YYYY-MM-DD HH24:MI'), 
                end_time = TO_TIMESTAMP(:3, 'YYYY-MM-DD HH24:MI') 
            WHERE schedule_id = :4
          `;

          await connection.execute(
            updateSql,
            [title, start_time, end_time, schedule_id],
            { autoCommit: false }
          );
        });

        return res.status(200).json({ message: "수정 성공" });
      }

      // 4. 일정 삭제 (DELETE) - 트랜잭션으로 동시성 제어
      case "DELETE": {
        const { id } = req.query;

        await executeTransaction(async (connection) => {
          // 삭제 전 일정 존재 확인 및 잠금
          const checkSql = `
            SELECT schedule_id
            FROM schedule
            WHERE schedule_id = :1
          `;
          const checkResult = await executeSelectForUpdate(
            checkSql,
            [id],
            connection
          );

          if (!checkResult.rows || checkResult.rows.length === 0) {
            throw new Error("일정을 찾을 수 없습니다.");
          }

          const deleteSql = `DELETE FROM schedule WHERE schedule_id = :1`;
          await connection.execute(deleteSql, [id], { autoCommit: false });
        });

        return res.status(200).json({ message: "삭제 성공" });
      }

      default:
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error: any) {
    console.error("Schedule API Error:", error);

    // Deadlock 에러 처리
    if (error.errorNum === 60) {
      return res.status(409).json({ 
        error: "동시 접속으로 인한 충돌이 발생했습니다. 잠시 후 다시 시도해주세요." 
      });
    }

    // 커스텀 에러 메시지 처리
    if (error.message) {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ error: "Database Operation Failed" });
  }
}
