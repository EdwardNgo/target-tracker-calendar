"use client"

import React, { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, isSameMonth, isSameDay, getDay } from 'date-fns'
import { Calendar as  ChevronLeft, ChevronRight, X, Trophy } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type DayData = {
  completed: boolean
  failed: boolean
  note: string
}

export default function TargetTrackerCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  // Update initial state to load from localStorage
  const [calendarData, setCalendarData] = useState<{ [key: string]: DayData }>({})

  const [streak, setStreak] = useState(0)
  const [showMilestonePopup, setShowMilestonePopup] = useState(false)
  const [milestoneReached, setMilestoneReached] = useState(0)

  // Load data from localStorage after mount
  useEffect(() => {
    const saved = localStorage.getItem('calendarData')
    if (saved) {
      setCalendarData(JSON.parse(saved))
    }
  }, [])

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem('calendarData', JSON.stringify(calendarData))
  }, [calendarData])

  useEffect(() => {
    calculateStreak()
  }, [calendarData])

  useEffect(() => {
    if (streak > 0 && streak % 10 === 0 && streak > milestoneReached) {
      setShowMilestonePopup(true)
      setMilestoneReached(streak)
    }
  }, [streak, milestoneReached])
    
  
  const calculateStreak = () => {
    let currentStreak = 0
    const date = new Date()

    while (true) {
      const dateString = format(date, 'yyyy-MM-dd')
      if (calendarData[dateString]?.completed) {
        currentStreak++
        date.setDate(date.getDate() - 1)
      } else {
        break
      }
    }


    setStreak(currentStreak)
  }


  const toggleDayStatus = (day: Date, status: 'completed' | 'failed') => {
    const dateString = format(day, 'yyyy-MM-dd')
    setCalendarData(prev => ({
      ...prev,
      [dateString]: {
        ...prev[dateString],
        completed: status === 'completed' ? !prev[dateString]?.completed : false,
        failed: status === 'failed' ? !prev[dateString]?.failed : false,
      }
    }))
  }

  const updateNote = (day: Date, note: string) => {
    const dateString = format(day, 'yyyy-MM-dd')
    setCalendarData(prev => ({
      ...prev,
      [dateString]: {
        ...prev[dateString],
        note
      }
    }))
  }

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const dateRange = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const startDay = getDay(monthStart)

    return (
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-bold text-sm text-muted-foreground py-2">{day}</div>
        ))}
        {Array.from({ length: startDay }).map((_, index) => (
          <div key={`empty-${index}`} className="h-16" />
        ))}
        {dateRange.map(day => {
          const dateString = format(day, 'yyyy-MM-dd')
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isToday = isSameDay(day, new Date())
          const dayData = calendarData[dateString]

          return (
            <Popover key={dateString}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-16 w-full p-0 flex flex-col items-center justify-start",
                    !isCurrentMonth && "opacity-50",
                    isToday && "border-primary",
                    dayData?.completed && "bg-green-100 hover:bg-green-200",
                    dayData?.failed && "bg-red-100 hover:bg-red-200"
                  )}
                >
                  <span className={cn("text-sm mt-1", isToday && "font-bold")}>{format(day, 'd')}</span>
                  {dayData?.completed && <Trophy className="h-4 w-4 text-green-600 mt-1" />}
                  {dayData?.failed && <X className="h-4 w-4 text-red-600 mt-1" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="font-semibold">{format(day, 'MMMM d, yyyy')}</div>
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`completed-${dateString}`}
                        checked={dayData?.completed}
                        onCheckedChange={() => toggleDayStatus(day, 'completed')}
                      />
                      <Label htmlFor={`completed-${dateString}`}>Completed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`failed-${dateString}`}
                        checked={dayData?.failed}
                        onCheckedChange={() => toggleDayStatus(day, 'failed')}
                      />
                      <Label htmlFor={`failed-${dateString}`}>Not Completed</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`note-${dateString}`}>Note</Label>
                    <Input
                      id={`note-${dateString}`}
                      value={dayData?.note || ''}
                      onChange={(e) => updateNote(day, e.target.value)}
                      placeholder="Add a note for this day"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )
        })}
      </div>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl">
      <CardHeader className="bg-primary text-primary-foreground">
        <CardTitle className="flex justify-between items-center">
          <span className="text-2xl font-bold">Target Tracker Calendar</span>
          <div className="flex items-center space-x-2 text-sm bg-primary-foreground text-primary px-3 py-1 rounded-full">
            <Trophy className="h-5 w-5" />
            <span>Streak: <span className="font-bold">{streak} days</span></span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => setCurrentDate(addMonths(currentDate, -1))}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <h2 className="text-2xl font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
          <Button variant="outline" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        {renderCalendar()}
        <div className="mt-6 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span>Not Completed</span>
          </div>
        </div>
      </CardContent>

      <Dialog open={showMilestonePopup} onOpenChange={setShowMilestonePopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Congratulations!</DialogTitle>
            <DialogDescription>
              You&apos;ve reached a milestone streak of {streak} days!
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            <Trophy className="h-24 w-24 text-yellow-400 mb-4" />
            <p className="text-lg font-semibold text-center">
              Keep up the great work! You&apos;re making excellent progress towards your goals.
            </p>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => setShowMilestonePopup(false)}>
              Continue Tracking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}