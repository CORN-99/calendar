import React, { useState, useEffect } from 'react';
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

  const userColors = {
    primary: '#60a5fa',
    friend1: '#f87171',
    friend2: '#34d399',
    friend3: '#fbbf24',
    friend4: '#a78bfa',
    friend5: '#fb923c',
  };


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

  // 일정 불러오기
  useEffect(() => {
    if (!userId) return;

    const fetchSchedules = async () => {
      try {
        const res = await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: userId }),
        });

        if (!res.ok) throw new Error("일정 조회 실패");

        const data = await res.json();
        setSchedules(
          (data.schedules || []).map((s) => ({
            schedule_id: s.SCHEDULE_ID,
            student_id: s.STUDENT_ID,
            title: s.TITLE,
            start_time: s.START_TIME,
            end_time: s.END_TIME,
          }))
        );
      } catch (e) {
        console.error(e);
      }
    };

    fetchSchedules();
  }, [userId]);

  // 수업(과목) 불러오기
  useEffect(() => {
    if (!userId) return;

    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: userId }),
        });

        if (!res.ok) throw new Error("수업 조회 실패");

        const data = await res.json();
        setCourses(
          (data.courses || []).map((c) => ({
            student_id: c.STUDENT_ID,
            course_id: c.COURSE_ID,
            section_id: c.SECTION_ID,
          }))
        );
      } catch (e) {
        console.error(e);
      }
    };

    fetchCourses();
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

        setGroups(Object.values(grouped));

        // students 목록에 친구들 추가
        setStudents((prev) => {
          const existingIds = new Set(prev.map((s) => s.student_id));
          const merged = [...prev];
          friendList.forEach((f) => {
            if (!existingIds.has(f.student_id)) {
              merged.push(f);
            }
          });
          return merged;
        });

        // friendships 배열 채우기 (me -> friend)
        setFriendships(
          friendList.map((f) => ({
            me: normalizedUser.student_id,
            friend: f.student_id,
          }))
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
    setVisibleStudents(prev => {
      if (prev.includes(studentId)) {
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== studentId);
      }
      return [...prev, studentId];
    });
  };

  const getUserColor = (studentId) => {
    if (studentId === normalizedUser?.student_id) return userColors.primary;
    const visibleIndex = visibleStudents.indexOf(studentId);
    const colorKeys = Object.keys(userColors).filter(k => k.startsWith('friend'));
    return userColors[colorKeys[visibleIndex % colorKeys.length]] || userColors.friend1;
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
      const match = part.trim().match(/([월화수목금])\s+(\d{2}):(\d{2})-(\d{2}):(\d{2})/);
      if (match) {
        const [, dayStr, startH, startM, endH, endM] = match;
        items.push({ dayOfWeek: days[dayStr], startHour: parseInt(startH), startMin: parseInt(startM), endHour: parseInt(endH), endMin: parseInt(endM) });
      }
    });
    return items;
  };

  const getAllCalendarItems = () => {
    const items = [];
    const weekDays = getWeekDays();
    
    schedules.forEach(schedule => {
      const startDate = new Date(schedule.start_time);
      const endDate = new Date(schedule.end_time);
      items.push({ id: `schedule-${schedule.schedule_id}`, type: 'schedule', title: schedule.title, date: startDate, startTime: startDate, endTime: endDate, color: getUserColor(schedule.student_id), studentId: schedule.student_id, data: schedule });
    });
    
    sections.forEach(section => {
      const times = parseTimeFromSection(section.time);
      times.forEach(time => {
        weekDays.forEach(weekDay => {
          if (weekDay.fullDate.getDay() === time.dayOfWeek) {
            const startTime = new Date(weekDay.fullDate);
            startTime.setHours(time.startHour, time.startMin, 0);
            const endTime = new Date(weekDay.fullDate);
            endTime.setHours(time.endHour, time.endMin, 0);
            items.push({ id: `section-${section.section_id}-${section.student_id}-${weekDay.day}`, type: 'course', title: section.title, date: startTime, startTime, endTime, color: getUserColor(section.student_id), studentId: section.student_id, data: section });
          }
        });
      });
    });
    
    return items;
  };

  const weekDays = getWeekDays();
  const hours = Array.from({ length: 13 }, (_, i) => i + 7);
  const allItems = getAllCalendarItems();
  const friends = getFriends();
  const getStudentName = (studentId) => students.find(s => s.student_id === studentId)?.name || '';

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

            {allItems.map((item) => {
              const matchingDay = weekDays.findIndex(d => d.fullDate.toDateString() === item.date.toDateString());
              if (matchingDay === -1) return null;
              const startHour = item.startTime.getHours();
              const startMin = item.startTime.getMinutes();
              const endHour = item.endTime.getHours();
              const endMin = item.endTime.getMinutes();
              const topPosition = (startHour - 7) * 60 + startMin;
              const duration = (endHour - startHour) * 60 + (endMin - startMin);
              return (
                <div key={item.id} className="absolute rounded px-2 py-1 text-xs cursor-pointer hover:opacity-90 transition-opacity overflow-hidden" style={{ backgroundColor: item.color, top: `${topPosition}px`, left: `${(matchingDay / 7) * 87.5 + 12.5}%`, width: '12%', height: `${duration}px`, minHeight: '30px', color: '#000' }}>
                  <div className="font-semibold truncate">{item.title}</div>
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