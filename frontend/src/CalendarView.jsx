import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, X, Edit2, Users, Calendar, Eye, EyeOff } from 'lucide-react';

const CalendarUI = ({ currentUser }) => {
  const normalizedUser = currentUser
    ? {
        student_id: currentUser.STUDENT_ID || currentUser.student_id,
        name: currentUser.NAME || currentUser.name,
        dept_id: currentUser.DEPT_ID || currentUser.dept_id,
      }
    : null;
  const userId = normalizedUser?.student_id;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [students, setStudents] = useState([]);
  const [visibleStudents, setVisibleStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [sections, setSections] = useState([]);
  const [academicEvents, setAcademicEvents] = useState([]);
  const [departmentEvents, setDepartmentEvents] = useState([]);
  const [studentGroups, setStudentGroups] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [newSchedule, setNewSchedule] = useState({
    title: '',
    start_time: '',
    end_time: ''
  });
  const [loadedStudents, setLoadedStudents] = useState([]);

  const userColors = {
    primary: '#60a5fa',
    friend1: '#f87171',
    friend2: '#34d399',
    friend3: '#fbbf24',
    friend4: '#a78bfa',
    friend5: '#fb923c',
  };

  const courseColorMap = useMemo(() => {
    const palette = [
      '#4f8cff',
      '#f97373',
      '#facc15',
      '#22c55e',
      '#a855f7',
      '#0ea5e9',
      '#f97316',
      '#2dd4bf',
    ];
    const map = {};
    let idx = 0;

    sections.forEach((sec) => {
      const key = sec.course_id || sec.title;
      if (!map[key]) {
        map[key] = palette[idx % palette.length];
        idx += 1;
      }
    });

    return map;
  }, [sections]);


  useEffect(() => {
    if (normalizedUser) {
      setStudents([
        {
          student_id: normalizedUser.student_id,
          name: normalizedUser.name,
          dept_id: normalizedUser.dept_id,
        },
      ]);
      setVisibleStudents([normalizedUser.student_id]);
    } else {
      setStudents([]);
      setVisibleStudents([]);
    }
  }, [userId]);

  const fetchStudentCalendarData = async (studentId) => {
    if (!studentId) return;
    try {
      const [schedRes, courseRes] = await Promise.all([
        fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        }),
        fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        }),
      ]);

      if (!schedRes.ok) throw new Error("일정 조회 실패");
      if (!courseRes.ok) throw new Error("수업 조회 실패");

      const schedData = await schedRes.json();
      const courseData = await courseRes.json();

      const schedRows = schedData.schedules || [];
      const courseRows = courseData.courses || [];

      const mappedSchedules = schedRows.map((s) => ({
        schedule_id: s.SCHEDULE_ID,
        student_id: s.STUDENT_ID,
        title: s.TITLE,
        start_time: s.START_TIME,
        end_time: s.END_TIME,
      }));

      const mappedSections = courseRows.map((c) => ({
        student_id: c.STUDENT_ID,
        course_id: c.COURSE_ID,
        section_id: c.SECTION_ID,
        title: c.TITLE,
        time: c.TIME,
      }));

      setSchedules((prev) => [
        ...prev.filter((s) => s.student_id !== studentId),
        ...mappedSchedules,
      ]);

      setSections((prev) => [
        ...prev.filter((sec) => sec.student_id !== studentId),
        ...mappedSections,
      ]);

      setCourses((prev) => [
        ...prev.filter((c) => c.student_id !== studentId),
        ...mappedSections,
      ]);

      setLoadedStudents((prev) =>
        prev.includes(studentId) ? prev : [...prev, studentId]
      );
    } catch (e) {
      console.error("calendar fetch error", e);
    }
  };

  // 초기에는 로그인한 사용자 일정/수업만 불러옴
  useEffect(() => {
    if (!userId) return;
    fetchStudentCalendarData(userId);
  }, [userId]);

  // 그룹/친구 불러오기
  useEffect(() => {
    if (!userId) return;

    const fetchGroups = async () => {
      try {
        const res = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: userId }),
        });

        if (!res.ok) throw new Error("그룹 조회 실패");

        const data = await res.json();

        // rows: [{ GROUP_ID, GROUP_NAME, CATEGORY, LEADER_ID, STUDENT_ID, NAME, (optional) DEPT_ID }, ...]
        const grouped = {};
        const friendMap = new Map();

        (data.rows || []).forEach((row) => {
          const gid = row.GROUP_ID;
          if (!grouped[gid]) {
            grouped[gid] = {
              groupId: row.GROUP_ID,
              name: row.GROUP_NAME,
              category: row.CATEGORY,
              leaderId: row.LEADER_ID,
              members: [],
            };
          }
          grouped[gid].members.push({
            student_id: row.STUDENT_ID,
            name: row.NAME,
            dept_id: row.DEPT_ID || "",
          });

          if (row.STUDENT_ID !== normalizedUser.student_id) {
            if (!friendMap.has(row.STUDENT_ID)) {
              friendMap.set(row.STUDENT_ID, {
                student_id: row.STUDENT_ID,
                name: row.NAME,
                dept_id: row.DEPT_ID || "",
              });
            }
          }
        });

        const friendList = Array.from(friendMap.values());
        const friendIds = new Set(friendList.map(f => f.student_id));

        setGroups(Object.values(grouped));

        // students 목록 업데이트: 친구가 더 이상 그룹에 없으면 제거, 새 친구는 추가
        setStudents((prev) => {
          const filtered = prev.filter(s => 
            s.student_id === normalizedUser.student_id || friendIds.has(s.student_id)
          );
          const existingIds = new Set(filtered.map(s => s.student_id));
          const newFriends = friendList.filter(f => !existingIds.has(f.student_id));
          return [...filtered, ...newFriends];
        });

        // friendships 배열 채우기 (me -> friend)
        const newFriendships = friendList.map((f) => ({
          me: normalizedUser.student_id,
          friend: f.student_id,
        }));
        setFriendships(newFriendships);

        // 더 이상 친구가 아닌 학생들의 데이터 정리
        const currentFriendIds = new Set(newFriendships.map(f => f.friend));
        setSchedules((prev) => 
          prev.filter(s => 
            s.student_id === normalizedUser.student_id || currentFriendIds.has(s.student_id)
          )
        );
        setSections((prev) => 
          prev.filter(sec => 
            sec.student_id === normalizedUser.student_id || currentFriendIds.has(sec.student_id)
          )
        );
        setCourses((prev) => 
          prev.filter(c => 
            c.student_id === normalizedUser.student_id || currentFriendIds.has(c.student_id)
          )
        );

        // visibleStudents에서도 제거 (단, 본인은 항상 유지)
        setVisibleStudents((prev) => {
          const filtered = prev.filter(id => 
            id === normalizedUser.student_id || currentFriendIds.has(id)
          );
          // 본인만 남으면 본인만 반환, 아니면 필터링된 결과 반환
          return filtered.length > 0 ? filtered : [normalizedUser.student_id];
        });

        // loadedStudents에서도 제거
        setLoadedStudents((prev) => 
          prev.filter(id => 
            id === normalizedUser.student_id || currentFriendIds.has(id)
          )
        );
      } catch (e) {
        console.error(e);
      }
    };

    fetchGroups();
  }, [userId]);

  const getFriends = () => {
    if (!normalizedUser) return [];
    const friendIds = friendships
      .filter(f => f.me === normalizedUser.student_id)
      .map(f => f.friend);
    return students.filter(s => friendIds.includes(s.student_id));
  };

  const toggleUserVisibility = (studentId) => {
    const isOn = visibleStudents.includes(studentId);
    
    if (isOn) {
      if (visibleStudents.length === 1) return; // 최소 1명은 항상 보이게
      
      // 토글을 끌 때 친구의 데이터 즉시 완전 삭제 (본인 제외)
      if (studentId !== normalizedUser?.student_id) {
        // 즉시 상태 업데이트
        setSchedules((prev) => {
          const filtered = prev.filter(s => s.student_id !== studentId);
          return filtered;
        });
        setSections((prev) => {
          const filtered = prev.filter(sec => sec.student_id !== studentId);
          return filtered;
        });
        setCourses((prev) => {
          const filtered = prev.filter(c => c.student_id !== studentId);
          return filtered;
        });
        setLoadedStudents((prev) => prev.filter(id => id !== studentId));
      }
      
      // visibleStudents에서 제거
      setVisibleStudents((prev) => prev.filter((id) => id !== studentId));
    } else {
      // 켜질 때 그 학생의 일정/수업이 없으면 불러오기
      if (!loadedStudents.includes(studentId)) {
        fetchStudentCalendarData(studentId);
      }
      setVisibleStudents((prev) => {
        if (prev.includes(studentId)) return prev;
        return [...prev, studentId];
      });
    }
  };

  const getUserColor = (studentId) => {
    if (studentId === normalizedUser?.student_id) return userColors.primary;
    return '#6b7280';
  };

  const handleAddSchedule = () => {
    if (!newSchedule.title || !newSchedule.start_time || !newSchedule.end_time) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    const scheduleData = {
      schedule_id: schedules.length + 1,
      title: newSchedule.title,
      start_time: newSchedule.start_time,
      end_time: newSchedule.end_time,
      student_id: normalizedUser.student_id
    };
    setSchedules([...schedules, scheduleData]);
    setShowScheduleModal(false);
    setNewSchedule({ title: '', start_time: '', end_time: '' });
  };

  const handleUpdateSchedule = () => {
    setSchedules(schedules.map(s => s.schedule_id === editingSchedule.schedule_id ? { ...s, ...newSchedule } : s));
    setShowScheduleModal(false);
    setEditingSchedule(null);
    setNewSchedule({ title: '', start_time: '', end_time: '' });
  };

  const handleDeleteSchedule = (scheduleId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    setSchedules(schedules.filter(s => s.schedule_id !== scheduleId));
  };

  const openEditModal = (schedule) => {
    setEditingSchedule(schedule);
    setNewSchedule({ title: schedule.title, start_time: schedule.start_time, end_time: schedule.end_time });
    setShowScheduleModal(true);
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return { day: date.getDate(), date: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][i], fullDate: date };
    });
  };
 
const parseTimeFromSection = (timeStr) => {
  const days = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5 };
  const items = [];
  if (!timeStr) return items;
  const parts = timeStr.split(',');

  parts.forEach(part => {
    // "월 09:00 ~ 10:30" 형식
    const match = part
      .trim()
      .match(/([월화수목금])\s+(\d{2}):(\d{2})\s*~\s*(\d{2}):(\d{2})/);

    if (match) {
      const [, dayStr, startH, startM, endH, endM] = match;
      items.push({
        dayOfWeek: days[dayStr],
        startHour: parseInt(startH, 10),
        startMin: parseInt(startM, 10),
        endHour: parseInt(endH, 10),
        endMin: parseInt(endM, 10),
      });
    }
  });

  return items;
};

  const weekDays = getWeekDays();
  const hours = Array.from({ length: 13 }, (_, i) => i + 7);
  
  // 현재 친구 목록 확인 (데이터 정리용)
  const currentFriendIds = new Set(friendships.map(f => f.friend));
  const validStudentIds = new Set([
    normalizedUser?.student_id,
    ...Array.from(currentFriendIds)
  ].filter(Boolean));
  
  // 유효한 학생의 데이터만 사용 (친구 관계가 끊어진 데이터 제거)
  // visibleStudents에 있는 학생의 데이터만 사용 (토글된 학생만 표시)
  const validSchedules = useMemo(() => {
    const visibleSet = new Set(visibleStudents);
    return schedules.filter(s => 
      visibleSet.has(s.student_id) && 
      (s.student_id === normalizedUser?.student_id || validStudentIds.has(s.student_id))
    );
  }, [schedules, validStudentIds, visibleStudents, normalizedUser?.student_id]);
  
  const validSections = useMemo(() => {
    const visibleSet = new Set(visibleStudents);
    return sections.filter(sec => 
      visibleSet.has(sec.student_id) && 
      (sec.student_id === normalizedUser?.student_id || validStudentIds.has(sec.student_id))
    );
  }, [sections, validStudentIds, visibleStudents, normalizedUser?.student_id]);
  
  // 캘린더 아이템 생성 (유효한 데이터만 사용, 중복 제거)
  const allItems = useMemo(() => {
    const items = [];
    const seenIds = new Set(); // 중복 방지
    
    validSchedules.forEach(schedule => {
      const id = `schedule-${schedule.schedule_id}`;
      if (seenIds.has(id)) return; // 중복 제거
      seenIds.add(id);
      
      const startDate = new Date(schedule.start_time);
      const endDate = new Date(schedule.end_time);
      items.push({ id, type: 'schedule', title: schedule.title, date: startDate, startTime: startDate, endTime: endDate, color: getUserColor(schedule.student_id), studentId: schedule.student_id, data: schedule });
    });
    
    validSections.forEach(section => {
      const isSelf = section.student_id === normalizedUser?.student_id;
      const courseColor = isSelf
        ? (courseColorMap[section.course_id || section.title] || userColors.primary)
        : getUserColor(section.student_id);
      const times = parseTimeFromSection(section.time);
      times.forEach(time => {
        weekDays.forEach(weekDay => {
          if (weekDay.fullDate.getDay() === time.dayOfWeek) {
            const startTime = new Date(weekDay.fullDate);
            startTime.setHours(time.startHour, time.startMin, 0);
            const endTime = new Date(weekDay.fullDate);
            endTime.setHours(time.endHour, time.endMin, 0);
            
            const id = `section-${section.section_id}-${section.student_id}-${weekDay.day}-${time.startHour}-${time.startMin}`;
            if (seenIds.has(id)) return; // 중복 제거
            seenIds.add(id);
            
            items.push({
              id,
              type: 'course',
              title: section.title,
              date: startTime,
              startTime,
              endTime,
              color: courseColor,
              studentId: section.student_id,
              data: section,
            });
          }
        });
      });
    });
    
    return items;
  }, [validSchedules, validSections, currentDate, courseColorMap, normalizedUser, weekDays]);
  
  // visibleStudents에 있는 학생의 아이템만 필터링 (이미 validSchedules/validSections에서 필터링했지만 이중 체크)
  const sortedItems = allItems.slice().sort((a, b) => a.startTime - b.startTime);
  const visibleItemsSet = new Set(visibleStudents);
  const visibleItems = sortedItems.filter(item => {
    // visibleStudents에 없으면 제외
    if (!visibleItemsSet.has(item.studentId)) return false;
    return true;
  });
  const friends = getFriends();
  const getStudentName = (studentId) => students.find(s => s.student_id === studentId)?.name || '';

  const isCourseContinuation = (items, idx) => {
    const item = items[idx];
    if (!item || item.type !== 'course') return false;

    const curKey = (item.data && item.data.course_id) || item.title;
    const curDateStr = item.date.toDateString();

    for (let j = idx - 1; j >= 0; j -= 1) {
      const prev = items[j];
      if (!prev || prev.type !== 'course') continue;
      if (prev.date.toDateString() !== curDateStr) continue;

      const prevKey = (prev.data && prev.data.course_id) || prev.title;
      if (prevKey !== curKey) continue;

      if (prev.endTime.getTime() === item.startTime.getTime()) {
        return true;
      }

      // 이전 시간이 현재 시작보다 앞이면 더 이상 볼 필요 없음
      if (prev.startTime.getTime() < item.startTime.getTime()) {
        break;
      }
    }

    return false;
  };

  // 두 이벤트가 시간적으로 겹치는지 확인하는 함수
  const isTimeOverlapping = (item1, item2) => {
    const start1 = item1.startTime.getTime();
    const end1 = item1.endTime.getTime();
    const start2 = item2.startTime.getTime();
    const end2 = item2.endTime.getTime();
    
    // 시간이 겹치는지 확인: 시작 시간이 다른 이벤트의 종료 시간보다 작고,
    // 종료 시간이 다른 이벤트의 시작 시간보다 커야 함
    // 단, 경계에서 만나는 경우(end1 === start2 또는 start1 === end2)는 겹치지 않는 것으로 간주
    return start1 < end2 && end1 > start2;
  };
  
  // 같은 날짜의 모든 이벤트를 겹치는 그룹으로 묶는 함수 (Union-Find 방식)
  const getOverlappingGroupsForDay = (dayItems) => {
    if (dayItems.length === 0) return [];
    
    const groups = [];
    const itemToGroup = new Map();
    
    dayItems.forEach(item => {
      // 현재 아이템과 겹치는 그룹 찾기
      const overlappingGroupIndices = [];
      
      groups.forEach((group, groupIdx) => {
        const hasOverlap = group.some(other => isTimeOverlapping(item, other));
        if (hasOverlap) {
          overlappingGroupIndices.push(groupIdx);
        }
      });
      
      if (overlappingGroupIndices.length === 0) {
        // 새로운 그룹 생성
        const newGroup = [item];
        groups.push(newGroup);
        itemToGroup.set(item.id, groups.length - 1);
      } else {
        // 첫 번째 겹치는 그룹에 추가
        const targetGroupIdx = overlappingGroupIndices[0];
        groups[targetGroupIdx].push(item);
        itemToGroup.set(item.id, targetGroupIdx);
        
        // 나머지 겹치는 그룹들을 첫 번째 그룹에 병합 (전이적 클로저)
        for (let i = overlappingGroupIndices.length - 1; i > 0; i--) {
          const mergeIdx = overlappingGroupIndices[i];
          const mergeGroup = groups[mergeIdx];
          
          mergeGroup.forEach(otherItem => {
            if (!groups[targetGroupIdx].some(existing => existing.id === otherItem.id)) {
              groups[targetGroupIdx].push(otherItem);
            }
            itemToGroup.set(otherItem.id, targetGroupIdx);
          });
          
          groups.splice(mergeIdx, 1);
          
          // 인덱스 재조정
          itemToGroup.forEach((groupIdx, itemId) => {
            if (groupIdx > mergeIdx) {
              itemToGroup.set(itemId, groupIdx - 1);
            }
          });
        }
      }
    });
    
    return groups;
  };
  
  // 특정 아이템이 속한 겹치는 그룹 찾기
  const getOverlappingGroupForItem = (items, currentItem) => {
    const targetDateStr = currentItem.date.toDateString();
    const dayItems = items.filter(item => item.date.toDateString() === targetDateStr);
    
    if (dayItems.length === 0) return [currentItem];
    
    const groups = getOverlappingGroupsForDay(dayItems);
    
    // 현재 아이템이 속한 그룹 찾기
    for (const group of groups) {
      if (group.some(item => item.id === currentItem.id)) {
        return group;
      }
    }
    
    return [currentItem]; // 겹치는 그룹이 없으면 자기 자신만
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="w-72 bg-gray-950 p-4 flex flex-col overflow-auto">
        <div className="mb-4">
          <h2 className="text-xs font-semibold mb-2 text-gray-400 uppercase">내 정보</h2>
          {normalizedUser && (
            <div
              className={`bg-gray-800 rounded-lg p-3 cursor-pointer border-2 ${
                visibleStudents.includes(normalizedUser.student_id)
                  ? 'border-blue-500'
                  : 'border-transparent'
              }`}
              onClick={() => toggleUserVisibility(normalizedUser.student_id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getUserColor(normalizedUser.student_id) }}
                    ></div>
                    {normalizedUser.name}
                  </div>
                  <div className="text-sm text-gray-400">학번: {normalizedUser.student_id}</div>
                </div>
                {visibleStudents.includes(normalizedUser.student_id) ? (
                  <Eye size={16} className="text-blue-400" />
                ) : (
                  <EyeOff size={16} className="text-gray-500" />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 mt-2">
          <h2 className="text-xs font-semibold mb-2 text-gray-400 uppercase flex items-center gap-1">
            <Calendar size={14} />매주 듣는 수업
          </h2>
          {courses.length === 0 ? (
            <div className="text-xs text-gray-400">수강 중인 과목 정보 없음</div>
          ) : (
            <ul className="text-xs text-gray-200 space-y-1">
              {courses.map((c, idx) => (
                <li key={idx}>
                  {c.course_id} - 분반 {c.section_id}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-4">
          <h2 className="text-xs font-semibold mb-2 text-gray-400 uppercase flex items-center gap-1"><Users size={14} />친구</h2>
          <div className="space-y-2">
            {friends.map(friend => (
              <div key={friend.student_id} className={`bg-gray-800 rounded-lg p-3 cursor-pointer border-2 transition-all ${visibleStudents.includes(friend.student_id) ? 'border-blue-500' : 'border-transparent hover:border-gray-600'}`} onClick={() => toggleUserVisibility(friend.student_id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getUserColor(friend.student_id) }}></div>
                    <div>
                      <div className="font-semibold text-sm">{friend.name}</div>
                      <div className="text-xs text-gray-400">{friend.dept_id}</div>
                    </div>
                  </div>
                  {visibleStudents.includes(friend.student_id) ? <Eye size={16} className="text-blue-400" /> : <EyeOff size={16} className="text-gray-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-xs font-semibold mb-2 text-gray-400 uppercase flex items-center gap-1">
            내 그룹 / 친구
          </h2>
          {groups.length === 0 ? (
            <div className="text-xs text-gray-400">가입된 그룹 없음</div>
          ) : (
            <div className="space-y-2 text-xs text-gray-200">
              {groups.map((g) => (
                <div
                  key={g.groupId}
                  className="border border-gray-700 rounded p-2"
                >
                  <div className="font-semibold">
                    {g.name}
                    {g.leaderId === normalizedUser?.student_id && (
                      <span className="ml-1 text-[10px] text-yellow-300">
                        (리더)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-400 mb-1">
                    분류: {g.category}
                  </div>
                  <div className="text-[11px] text-gray-300">
                    멤버:{" "}
                    {g.members
                      .map((m) =>
                        m.student_id === normalizedUser?.student_id
                          ? `${m.name}(나)`
                          : m.name
                      )
                      .join(", ")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1"><Calendar size={14} />개인 일정</h2>
            <button onClick={() => { setEditingSchedule(null); setNewSchedule({ title: '', start_time: '', end_time: '' }); setShowScheduleModal(true); }} className="text-blue-400 hover:text-blue-300"><Plus size={14} /></button>
          </div>
          <div className="space-y-2">
            {schedules
              .filter(s => s.student_id === normalizedUser?.student_id)
              .map(schedule => (
                <div key={schedule.schedule_id} className="bg-gray-800 rounded-lg p-2 text-sm group">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold">{schedule.title}</div>
                      <div className="text-xs text-gray-400">{new Date(schedule.start_time).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(schedule)} className="text-gray-400 hover:text-blue-400"><Edit2 size={12} /></button>
                      <button onClick={() => handleDeleteSchedule(schedule.schedule_id)} className="text-gray-400 hover:text-red-400"><X size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-800">
          <h2 className="text-xs font-semibold mb-2 text-gray-400 uppercase">범례</h2>
          <div className="space-y-1 text-xs">
            {visibleStudents.map(studentId => (
              <div key={studentId} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getUserColor(studentId) }}></div>
                <span>{getStudentName(studentId)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-800">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }} className="p-1 hover:bg-gray-700 rounded"><ChevronLeft size={20} /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 hover:bg-gray-700 rounded text-sm">Today</button>
              <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }} className="p-1 hover:bg-gray-700 rounded"><ChevronRight size={20} /></button>
            </div>
            <div className="text-lg font-semibold">{currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}</div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-8 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
            <div className="p-3"></div>
            {weekDays.map((day) => (
              <div key={day.day} className="border-l border-gray-700 p-3 text-center">
                <div className="text-xs text-gray-400">{day.date}</div>
                <div className={`text-2xl mt-1 ${day.fullDate.toDateString() === new Date().toDateString() ? 'bg-blue-500 rounded-full w-10 h-10 flex items-center justify-center mx-auto' : ''}`}>{day.day}</div>
              </div>
            ))}
          </div>

          <div className="relative">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b border-gray-700" style={{ height: '60px' }}>
                <div className="p-2 text-right text-sm text-gray-400 pr-3">{hour > 12 ? hour - 12 : hour} {hour < 12 ? 'AM' : 'PM'}</div>
                {weekDays.map((day) => (<div key={`${day.day}-${hour}`} className="border-l border-gray-700 relative"></div>))}
              </div>
            ))}

            {visibleItems.map((item, idx) => {
              const matchingDay = weekDays.findIndex(
                (d) => d.fullDate.toDateString() === item.date.toDateString()
              );
              if (matchingDay === -1) return null;

              const startHour = item.startTime.getHours();
              const startMin = item.startTime.getMinutes();
              const endHour = item.endTime.getHours();
              const endMin = item.endTime.getMinutes();
              const topPosition = (startHour - 7) * 60 + startMin;
              const duration =
                (endHour - startHour) * 60 + (endMin - startMin);

              const dayBaseLeft = (matchingDay / 7) * 87.5 + 12.5; // 요일별 시작 위치
              const dayColumnWidth = 12; // 각 요일 칼럼의 전체 폭 (% 기준)

              // 현재 이벤트의 시간대에서 실제로 겹치는 이벤트만 찾기
              const targetDateStr = item.date.toDateString();
              const itemStart = item.startTime.getTime();
              const itemEnd = item.endTime.getTime();
              
              // 같은 날짜의 이벤트 중에서 현재 이벤트와 시간이 겹치는 것만 찾기
              const overlappingItems = visibleItems.filter(other => {
                if (other.id === item.id) return false;
                if (other.date.toDateString() !== targetDateStr) return false;
                
                const otherStart = other.startTime.getTime();
                const otherEnd = other.endTime.getTime();
                
                // 현재 이벤트의 시간대와 겹치는지 확인
                return otherStart < itemEnd && otherEnd > itemStart;
              });
              
              // 겹치는 이벤트가 없으면 전체 너비 사용
              let leftPercent, widthPercent;
              
              if (overlappingItems.length === 0) {
                // 겹치지 않으면 전체 너비 사용
                leftPercent = dayBaseLeft;
                widthPercent = dayColumnWidth - 0.5;
              } else {
                // 겹치는 경우: 현재 이벤트를 포함한 그룹 내에서만 분할
                const allOverlapping = [item, ...overlappingItems];
                const overlappingCount = allOverlapping.length;
                const slotWidth = dayColumnWidth / overlappingCount;
                
                // 현재 아이템이 겹치는 그룹 내에서 몇 번째인지 찾기
                // 같은 시간대에 시작하는 순서대로 정렬, 그 다음 학생 순서
                const sortedOverlapping = [...allOverlapping].sort((a, b) => {
                  const timeDiff = a.startTime.getTime() - b.startTime.getTime();
                  if (timeDiff !== 0) return timeDiff;
                  // 같은 시간이면 visibleStudents 순서대로
                  const aIdx = visibleStudents.indexOf(a.studentId);
                  const bIdx = visibleStudents.indexOf(b.studentId);
                  return aIdx - bIdx;
                });
                
                // 현재 아이템의 위치 찾기 (id로 정확히 매칭)
                const positionInGroup = sortedOverlapping.findIndex(overlap => 
                  overlap.id === item.id
                );
                
                if (positionInGroup === -1) {
                  // 찾지 못한 경우 (이상하지만 안전장치)
                  leftPercent = dayBaseLeft;
                  widthPercent = dayColumnWidth - 0.5;
                } else {
                  leftPercent = dayBaseLeft + slotWidth * positionInGroup;
                  widthPercent = slotWidth - 0.5; // 칼럼 사이 약간의 간격
                }
              }

              const continuation = isCourseContinuation(visibleItems, idx);

              return (
                <div
                  key={item.id}
                  className="absolute rounded px-2 py-1 text-xs cursor-pointer hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: item.color,
                    top: `${topPosition}px`,
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    height: `${duration}px`,
                    minHeight: '30px',
                    color: '#000',
                    overflow: 'hidden',
                    wordBreak: 'break-word',
                  }}
                >
                  {!continuation && (
                    <div className="font-semibold" style={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%'
                    }}>{item.title}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{editingSchedule ? '일정 수정' : '새 일정 추가'}</h2>
              <button onClick={() => { setShowScheduleModal(false); setEditingSchedule(null); }}><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-sm mb-1">제목</label><input type="text" placeholder="일정 제목" value={newSchedule.title} onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})} className="w-full bg-gray-700 rounded px-3 py-2 outline-none" /></div>
              <div><label className="block text-sm mb-1">시작 시간</label><input type="datetime-local" value={newSchedule.start_time} onChange={(e) => setNewSchedule({...newSchedule, start_time: e.target.value})} className="w-full bg-gray-700 rounded px-3 py-2 outline-none" /></div>
              <div><label className="block text-sm mb-1">종료 시간</label><input type="datetime-local" value={newSchedule.end_time} onChange={(e) => setNewSchedule({...newSchedule, end_time: e.target.value})} className="w-full bg-gray-700 rounded px-3 py-2 outline-none" /></div>
              <button onClick={editingSchedule ? handleUpdateSchedule : handleAddSchedule} className="w-full bg-blue-500 hover:bg-blue-600 rounded px-4 py-2 font-semibold">{editingSchedule ? '수정' : '추가'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarUI;