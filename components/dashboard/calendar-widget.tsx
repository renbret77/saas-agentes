"use client"

import { useState } from "react"
import { 
    format, 
    addMonths, 
    subMonths, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    isSameMonth, 
    isSameDay, 
    addDays, 
    eachDayOfInterval,
    isToday
} from "date-fns"
import { es } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import { 
    ChevronLeft, 
    ChevronRight, 
    Clock, 
    CreditCard, 
    ShieldAlert, 
    Cake,
    ExternalLink,
    MoreHorizontal
} from "lucide-react"

interface Event {
    id: string
    title: string
    date: string
    type: 'renewal' | 'payment' | 'birthday' | 'task'
    description: string
    color: string
    status?: string
}

interface CalendarWidgetProps {
    events: Event[]
    onRefresh: () => void
}

export function CalendarWidget({ events, onRefresh }: CalendarWidgetProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-slate-900 capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">Visualizando {events.length} eventos este período</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    <button 
                        onClick={prevMonth}
                        className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-600"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setCurrentMonth(new Date())}
                        className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        Hoy
                    </button>
                    <button 
                        onClick={nextMonth}
                        className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-600"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        )
    }

    const renderDays = () => {
        const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
        return (
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/30">
                {days.map((day, i) => (
                    <div key={i} className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {day}
                    </div>
                ))}
            </div>
        )
    }

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(monthStart)
        const startDate = startOfWeek(monthStart)
        const endDate = endOfWeek(monthEnd)

        const calendarDays = eachDayOfInterval({
            start: startDate,
            end: endDate
        })

        return (
            <div className="grid grid-cols-7 bg-slate-100/20">
                {calendarDays.map((day, i) => {
                    const dayEvents = events.filter(e => isSameDay(new Date(e.date), day))
                    const isSelected = isSameDay(day, selectedDate)
                    const isCurrentMonth = isSameMonth(day, monthStart)
                    const isTd = isToday(day)

                    return (
                        <div
                            key={i}
                            className={`min-h-[120px] bg-white border-r border-b border-slate-100 p-2 transition-all hover:bg-slate-50/80 group cursor-pointer ${
                                !isCurrentMonth ? 'bg-slate-50/40 text-slate-300' : 'text-slate-700'
                            } ${isSelected ? 'ring-2 ring-emerald-500 ring-inset z-10' : ''}`}
                            onClick={() => setSelectedDate(day)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                                    isTd ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : ''
                                }`}>
                                    {format(day, 'd')}
                                </span>
                                {dayEvents.length > 0 && isCurrentMonth && (
                                    <span className="text-[9px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {dayEvents.length} {dayEvents.length === 1 ? 'Ene' : 'Evs'}
                                    </span>
                                )}
                            </div>
                            
                            <div className="space-y-1">
                                {dayEvents.slice(0, 3).map(event => (
                                    <div 
                                        key={event.id}
                                        className={`px-2 py-1 rounded-md text-[9px] font-bold truncate border flex items-center gap-1.5 transition-transform hover:scale-[1.02] ${
                                            event.type === 'renewal' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                            event.type === 'payment' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                            'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}
                                    >
                                        <div className={`w-1 h-1 rounded-full shrink-0 ${
                                            event.type === 'renewal' ? 'bg-rose-500' :
                                            event.type === 'payment' ? 'bg-amber-500' :
                                            'bg-blue-500'
                                        }`} />
                                        {event.title.split(':')[1] || event.title}
                                    </div>
                                ))}
                                {dayEvents.length > 3 && (
                                    <div className="text-[9px] font-bold text-slate-400 pl-2">
                                        + {dayEvents.length - 3} más
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {renderHeader()}
            {renderDays()}
            <div className="flex-1 overflow-auto custom-scrollbar">
                {renderCells()}
            </div>
            
            {/* Legend / Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center gap-6 bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Renovaciones</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pagos</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tareas/Citas</span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-400 italic">Última actualización: hace un momento</span>
                </div>
            </div>
        </div>
    )
}
