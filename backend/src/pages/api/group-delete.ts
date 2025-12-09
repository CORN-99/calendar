// src/pages/api/group-delete.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { group_id, student_id, action } = req.query;

  if (!group_id || !student_id) {
    return res.status(400).json({ message: "그룹 ID와 학생 ID가 필요합니다." });
  }

  try {
    // 그룹 정보 확인 (groups.ts와 동일한 형식 사용)
    const groupCheckSql = `
      SELECT group_id, leader, g_name
      FROM student_group
      WHERE group_id = :1
    `;
    const groupResult = await executeQuery(groupCheckSql, [group_id]);
    const groupRows = (groupResult as any).rows || [];

    if (groupRows.length === 0) {
      return res.status(404).json({ message: "그룹을 찾을 수 없습니다." });
    }

    const group = groupRows[0];
    const leaderId = group.LEADER || group.leader;
    const isLeader = leaderId === student_id;

    // action이 "leave"면 탈퇴, "delete"면 그룹 삭제 (리더만)
    if (action === "delete") {
      // 그룹 삭제 (리더만 가능)
      if (!isLeader) {
        return res.status(403).json({ message: "그룹 삭제는 리더만 가능합니다." });
      }

      // MEMBER 테이블에서 모든 멤버 삭제
      const deleteMembersSql = `
        DELETE FROM member
        WHERE group_id = :1
      `;
      await executeQuery(deleteMembersSql, [group_id], {
        autoCommit: false,
      });

      // STUDENT_GROUP 테이블에서 그룹 삭제
      const deleteGroupSql = `
        DELETE FROM student_group
        WHERE group_id = :1
      `;
      await executeQuery(deleteGroupSql, [group_id], {
        autoCommit: true,
      });

      return res.status(200).json({ message: "그룹이 삭제되었습니다." });
    } else {
      // 그룹 탈퇴 (멤버만 자신을 삭제)
      const checkMemberSql = `
        SELECT student_id
        FROM member
        WHERE group_id = :1 AND student_id = :2
      `;
      const memberResult = await executeQuery(checkMemberSql, [group_id, student_id]);
      const memberRows = (memberResult as any).rows || [];

      if (memberRows.length === 0) {
        return res.status(404).json({ message: "해당 그룹의 멤버가 아닙니다." });
      }

      // 리더는 탈퇴할 수 없음 (그룹을 삭제해야 함)
      if (isLeader) {
        return res.status(400).json({ message: "리더는 탈퇴할 수 없습니다. 그룹을 삭제해주세요." });
      }

      // MEMBER 테이블에서 자신만 삭제
      const leaveGroupSql = `
        DELETE FROM member
        WHERE group_id = :1 AND student_id = :2
      `;
      await executeQuery(leaveGroupSql, [group_id, student_id], {
        autoCommit: true,
      });

      return res.status(200).json({ message: "그룹에서 탈퇴했습니다." });
    }
  } catch (err: any) {
    console.error("GROUP DELETE ERROR:", err);
    
    // 롤백
    try {
      await executeQuery("ROLLBACK", [], { autoCommit: true });
    } catch (rollbackErr) {
      console.error("ROLLBACK ERROR:", rollbackErr);
    }

    return res.status(500).json({ 
      message: "서버 에러", 
      error: String(err),
      details: err.message || String(err)
    });
  }
}

