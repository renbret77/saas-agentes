"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, User, Briefcase, Phone, FileText, Users, Plus, Trash2, MapPin, BadgeCheck, Mail, MessageSquare, BellRing } from "lucide-react"
import Link from "next/link"
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { supabase } from "@/lib/supabase"
import { Database } from "@/types/database.types"

type ClientInsert = Database['public']['Tables']['clients']['Insert'] & {
    mobile_phone?: string | null
    work_phone?: string | null
    whatsapp?: string | null
    telegram?: string | null
    secondary_email?: string | null
}

const TABS = [
    { id: 'generales', label: 'Datos Generales', icon: User },
    { id: 'adicionales', label: 'Adicionales', icon: Briefcase },
    { id: 'direcciones', label: 'Direcciones', icon: MapPin },
    { id: 'identificacion', label: 'Identificación', icon: BadgeCheck },
    { id: 'contactos', label: 'Relaciones (Familia/Socios)', icon: Users },
    { id: 'comunicaciones', label: 'Comunicaciones', icon: MessageSquare },
]

export default function EditClientPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params)
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('generales')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState<Partial<ClientInsert>>({
        first_name: "",
        last_name: "",
        email: "",
        secondary_email: "",
        phone: "",
        mobile_phone: "",
        work_phone: "",
        type: "fisica",
        rfc: "",
        curp: "",
        fiscal_regime: "",
        birth_date: "",
        gender: "male",
        marital_status: "",
        company_name: "",
        profession: "",
        job_title: "",
        industry: "",
        website: "",
        notes: "",
        whatsapp: "",
        telegram: "",
        related_contacts: [],
        addresses: [],
        identifications: []
    })

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const { data, error } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('id', params.id)
                    .single()

                if (error) throw error
                if (data) {
                    // Helper to ensure E.164 format for existing data to avoid console warnings
                    const ensureE164 = (phone: string | null) => {
                        if (!phone) return ''
                        if (phone.startsWith('+')) return phone
                        // Default to Mexico (+52) if purely numeric and 10 digits, or just leave as is if weird
                        return `+52${phone}`
                    }

                    const clientData = data as any;
                    setFormData({
                        ...clientData,
                        phone: ensureE164(clientData.phone),
                        mobile_phone: ensureE164(clientData.mobile_phone),
                        work_phone: ensureE164(clientData.work_phone)
                    })
                }
            } catch (error) {
                console.error('Error fetching client:', error)
                alert("Error cargando cliente")
                router.push('/dashboard/clients')
            } finally {
                setLoading(false)
            }
        }

        fetchClient()
    }, [params.id, router])

    const addItem = (field: 'related_contacts' | 'addresses' | 'identifications', initialItem: any) => {
        const currentList = (formData[field] as any[]) || []
        setFormData({
            ...formData,
            [field]: [...currentList, initialItem]
        })
    }

    const removeItem = (field: 'related_contacts' | 'addresses' | 'identifications', index: number) => {
        const currentList = (formData[field] as any[]) || []
        setFormData({
            ...formData,
            [field]: currentList.filter((_, i) => i !== index)
        })
    }

    const updateItem = (field: 'related_contacts' | 'addresses' | 'identifications', index: number, subfield: string, value: any) => {
        const currentList = [...((formData[field] as any[]) || [])]
        currentList[index] = { ...currentList[index], [subfield]: value }
        setFormData({ ...formData, [field]: currentList })
    }

    const addContact = () => addItem('related_contacts', { name: '', relation: '', email: '', phone: '', is_payer: false, notify: false })
    const removeContact = (index: number) => removeItem('related_contacts', index)
    const updateContact = (index: number, field: string, value: any) => updateItem('related_contacts', index, field, value)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handlePhoneChange = (value: string | undefined, name: string) => {
        setFormData({
            ...formData,
            [name]: value
        })
    }

    // Helper for Title Case
    const toTitleCase = (str: string) => {
        return str.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                alert("Sesión expirada.")
                return
            }

            // Clean and Format Data
            const cleanedData: ClientInsert = {
                ...(formData as any),
                user_id: user.id,
                // Apply Title Case to names and texts
                first_name: toTitleCase(formData.first_name || ''),
                last_name: toTitleCase(formData.last_name || ''),
                company_name: formData.company_name ? toTitleCase(formData.company_name) : null,
                job_title: formData.job_title ? toTitleCase(formData.job_title) : null,
                profession: formData.profession ? toTitleCase(formData.profession) : null,
            }

            // Cleanup empty date strings
            if (cleanedData.birth_date === "") cleanedData.birth_date = null

            // Remove ID and created_at/user_id from update payload if present/readonly
            const { id, created_at, user_id, ...restPayload } = cleanedData as any
            const updatePayload = restPayload as Database['public']['Tables']['clients']['Update']

            const { error } = await (supabase.from('clients') as any)
                .update(updatePayload)
                .eq('id', params.id)

            if (error) throw error

            alert("Cliente actualizado exitosamente")
            router.push('/dashboard/clients')
            router.refresh()

        } catch (error: any) {
            console.error('Error:', error)
            alert("Error al guardar: " + error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteClient = async () => {
        const confirmPhrase = "borrar cliente"
        const userInput = prompt(`¿Estás seguro de eliminar este cliente? Esta acción es irreversible.\n\nPara confirmar, escribe: ${confirmPhrase}`)

        if (userInput === confirmPhrase) {
            try {
                setSaving(true)
                const { error } = await supabase
                    .from('clients')
                    .delete()
                    .eq('id', params.id)

                if (error) throw error

                alert("Cliente eliminado exitosamente")
                router.push('/dashboard/clients')
                router.refresh()
            } catch (error: any) {
                console.error('Error delete:', error)
                alert("Error al eliminar: " + error.message)
            } finally {
                setSaving(false)
            }
        } else if (userInput !== null) {
            alert("Confirmación incorrecta. No se eliminó el cliente.")
        }
    }

    if (loading) return <div className="p-8 text-center">Cargando datos del cliente...</div>

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard/clients" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                        <Link href="/dashboard/clients" className="hover:text-emerald-600">Volver a la lista</Link>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Editar Cliente</h1>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md shadow-emerald-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Guardando...' : 'Actualizar Cliente'}
                </button>
                <button
                    onClick={handleDeleteClient}
                    disabled={saving}
                    type="button"
                    className="p-2.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-200"
                    title="Eliminar Cliente"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                {TABS.map(tab => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                                ${isActive
                                    ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                                }
                            `}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 pb-20">
                {/* 1. DATOS GENERALES */}
                {activeTab === 'generales' && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Tipo de Persona</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white"
                                >
                                    <option value="fisica">Física</option>
                                    <option value="moral">Moral</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">RFC</label>
                                <input
                                    name="rfc"
                                    value={formData.rfc || ''}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase();
                                        setFormData(prev => {
                                            const updates: any = { rfc: val };
                                            // Extraer fecha de nacimiento si es RFC de persona física (13 caracteres y no tiene fecha aún)
                                            // v19.5: RFC Física empieza en pos 4 (ABCDYYMMDD...)
                                            if (val.length >= 10 && !prev.birth_date && val.length === 13) {
                                                const datePart = val.substring(4, 10);
                                                if (/^\d{6}$/.test(datePart)) {
                                                    let year = parseInt(datePart.substring(0, 2));
                                                    const month = datePart.substring(2, 4);
                                                    const day = datePart.substring(4, 6);
                                                    year += (year > 30 ? 1900 : 2000);
                                                    updates.birth_date = `${year}-${month}-${day}`;
                                                }
                                            }
                                            return { ...prev, ...updates };
                                        });
                                    }}
                                    placeholder="XAXX010101000"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 uppercase font-mono"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Nombre *</label>
                                <input required name="first_name" value={formData.first_name || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 capitalize" placeholder="Ej. Juan Carlos" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Apellidos *</label>
                                <input required name="last_name" value={formData.last_name || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 capitalize" placeholder="Ej. Pérez López" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Fecha de Nacimiento</label>
                                <input type="date" name="birth_date" value={formData.birth_date || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Género</label>
                                <select name="gender" value={formData.gender || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white">
                                    <option value="">Seleccione...</option>
                                    <option value="male">Masculino</option>
                                    <option value="female">Femenino</option>
                                    <option value="other">Otro / No aplica</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">CURP</label>
                                <input name="curp" value={formData.curp || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 uppercase" placeholder="18 Caracteres" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Régimen Fiscal</label>
                                <select name="fiscal_regime" value={formData.fiscal_regime || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white font-medium">
                                    <option value="">Seleccione...</option>
                                    <option value="601">601 - General de Ley Personas Morales</option>
                                    <option value="603">603 - Personas Morales con Fines no Lucrativos</option>
                                    <option value="605">605 - Sueldos y Salarios e Ingresos Asimilados a Salarios</option>
                                    <option value="606">606 - Arrendamiento</option>
                                    <option value="607">607 - Enajenación o Adquisición de Bienes</option>
                                    <option value="608">608 - Demás Ingresos</option>
                                    <option value="610">610 - Residentes en el Extranjero sin Establecimiento Permanente en México</option>
                                    <option value="611">611 - Ingresos por Dividendos (socios y accionistas)</option>
                                    <option value="612">612 - Personas Físicas con Actividades Empresariales y Profesionales</option>
                                    <option value="614">614 - Ingresos por Intereses</option>
                                    <option value="615">615 - Régimen de los ingresos por obtención de premios</option>
                                    <option value="616">616 - Sin obligaciones fiscales</option>
                                    <option value="620">620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos</option>
                                    <option value="621">621 - Incorporación Fiscal</option>
                                    <option value="622">622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras</option>
                                    <option value="623">623 - Opcional para Grupos de Sociedades</option>
                                    <option value="624">624 - Coordinados</option>
                                    <option value="625">625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas</option>
                                    <option value="626">626 - Régimen Simplificado de Confianza (RESICO)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Estado Civil</label>
                                <select name="marital_status" value={formData.marital_status || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white">
                                    <option value="">Seleccione...</option>
                                    <option value="soltero">Soltero/a</option>
                                    <option value="casado">Casado/a</option>
                                    <option value="divorciado">Divorciado/a</option>
                                    <option value="viudo">Viudo/a</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Email Principal *</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                    <input type="email" required name="email" value={formData.email || ''} onChange={handleChange} className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200" placeholder="principal@ejemplo.com" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Email Secundario</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                    <input type="email" name="secondary_email" value={formData.secondary_email || ''} onChange={handleChange} className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200" placeholder="alternativo@ejemplo.com" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Teléfono Móvil (WhatsApp)</label>
                                <PhoneInput
                                    international
                                    defaultCountry="MX"
                                    value={formData.mobile_phone || undefined}
                                    onChange={(val) => handlePhoneChange(val, 'mobile_phone')}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 phone-input-container"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Teléfono Casa/Personal</label>
                                <PhoneInput
                                    international
                                    defaultCountry="MX"
                                    value={formData.phone || undefined}
                                    onChange={(val) => handlePhoneChange(val, 'phone')}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 phone-input-container"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Teléfono Oficina</label>
                                <PhoneInput
                                    international
                                    defaultCountry="MX"
                                    value={formData.work_phone || undefined}
                                    onChange={(val) => handlePhoneChange(val, 'work_phone')}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 phone-input-container"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. ADICIONALES */}
                {activeTab === 'adicionales' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">Datos Laborales</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Empresa / Lugar de Trabajo</label>
                                <input name="company_name" value={formData.company_name || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 capitalize" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Puesto / Cargo</label>
                                <input name="job_title" value={formData.job_title || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 capitalize" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Profesión</label>
                                <input name="profession" value={formData.profession || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 capitalize" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Giro / Industria</label>
                                <input name="industry" value={formData.industry || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 capitalize" />
                            </div>
                        </div>
                    </div>
                )}

                {/* 2b. DIRECCIONES */}
                {activeTab === 'direcciones' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Domicilios</h3>
                                <p className="text-sm text-slate-500">Fiscal, Riesgo (Ubicación de inmuebles) o Correspondencia.</p>
                            </div>
                            <button onClick={() => addItem('addresses', { type: 'fiscal', street: '', ext_num: '', int_num: '', colony: '', zip: '', city: '', state: '' })} type="button" className="text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Agregar Dirección
                            </button>
                        </div>

                        {(formData.addresses as any[])?.map((addr, index) => (
                            <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group transition-all hover:shadow-sm mb-4">
                                <button type="button" onClick={() => removeItem('addresses', index)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-xs font-medium text-slate-500">Tipo</label>
                                        <select value={addr.type} onChange={(e) => updateItem('addresses', index, 'type', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm bg-white">
                                            <option value="fiscal">Fiscal</option>
                                            <option value="riesgo">Riesgo (Casa/Oficina)</option>
                                            <option value="correspondencia">Correspondencia</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-6 space-y-1">
                                        <label className="text-xs font-medium text-slate-500">Calle</label>
                                        <input value={addr.street} onChange={(e) => updateItem('addresses', index, 'street', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm capitalize" />
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-xs font-medium text-slate-500">No. Ext</label>
                                        <input value={addr.ext_num} onChange={(e) => updateItem('addresses', index, 'ext_num', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm" />
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-xs font-medium text-slate-500">No. Int</label>
                                        <input value={addr.int_num} onChange={(e) => updateItem('addresses', index, 'int_num', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm" />
                                    </div>

                                    <div className="md:col-span-4 space-y-1">
                                        <label className="text-xs font-medium text-slate-500">Colonia</label>
                                        <input value={addr.colony} onChange={(e) => updateItem('addresses', index, 'colony', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm capitalize" />
                                    </div>
                                    <div className="md:col-span-2 space-y-1 relative">
                                        <label className="text-xs font-medium text-slate-500">C.P. (Auto)</label>
                                        <input
                                            value={addr.zip}
                                            onChange={async (e) => {
                                                const newZip = e.target.value;
                                                // 1. Update visual state immediately
                                                updateItem('addresses', index, 'zip', newZip);

                                                // 2. Geo Intelligence Lookup (only on full zip)
                                                if (newZip.length === 5) {
                                                    const { data } = await supabase.from('postal_codes_intelligence').select('*').eq('zip_code', newZip).single();
                                                    const geoData = data as any;

                                                    if (geoData) {
                                                        // Use functional update to ensure we have latest state
                                                        setFormData(prev => {
                                                            const currentList = [...(prev.addresses as any[])];
                                                            // Ensure the zip is the one the user just typed (fixes the "eating character" bug)
                                                            currentList[index] = {
                                                                ...currentList[index],
                                                                zip: newZip, // Enforce current zip
                                                                colony: geoData.colony || currentList[index].colony,
                                                                city: geoData.municipality || currentList[index].city,
                                                                state: geoData.state || currentList[index].state,
                                                                risk_data: { level: geoData.socioeconomic_level || '', risk: geoData.risk_score || '' }
                                                            };
                                                            return { ...prev, addresses: currentList };
                                                        });
                                                    }
                                                }
                                            }}
                                            className={`w-full px-3 py-1.5 rounded-lg border text-sm font-medium text-slate-900 transition-colors ${addr.risk_data ? 'border-blue-400 ring-2 ring-blue-100 bg-blue-50' : 'border-slate-200'
                                                }`}
                                            placeholder="00000"
                                            maxLength={5}
                                        />
                                        {/* Visual Indicator */}
                                        {addr.risk_data && (
                                            <div className="absolute -top-1 -right-1">
                                                <span className="flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-3 space-y-1">
                                        <label className="text-xs font-medium text-slate-500">Ciudad/Municipio</label>
                                        <input
                                            value={addr.city}
                                            onChange={(e) => updateItem('addresses', index, 'city', e.target.value)}
                                            style={{ textTransform: 'capitalize' }}
                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm capitalize"
                                        />
                                    </div>
                                    <div className="md:col-span-3 space-y-1">
                                        <label className="text-xs font-medium text-slate-500">Estado</label>
                                        <input
                                            value={addr.state}
                                            onChange={(e) => updateItem('addresses', index, 'state', e.target.value)}
                                            style={{ textTransform: 'capitalize' }}
                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm capitalize"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!formData.addresses || (formData.addresses as any[]).length === 0) && (
                            <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg text-slate-500 text-sm">No hay direcciones agregadas.</div>
                        )}
                    </div>
                )}

                {/* 2c. IDENTIFICACIONES */}
                {activeTab === 'identificacion' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Documentos de Identificación (PLD)</h3>
                                <p className="text-sm text-slate-500">INE, Pasaporte, Cédula con vigencias.</p>
                            </div>
                            <button onClick={() => addItem('identifications', { type: 'ine', number: '', expires_at: '' })} type="button" className="text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Agregar Documento
                            </button>
                        </div>

                        {(formData.identifications as any[])?.map((doc, index) => (
                            <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group transition-all hover:shadow-sm mb-4">
                                <button type="button" onClick={() => removeItem('identifications', index)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>

                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-3 space-y-1">
                                        <label className="text-xs font-medium text-slate-500">Documento</label>
                                        <select value={doc.type} onChange={(e) => updateItem('identifications', index, 'type', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm bg-white">
                                            <option value="ine">INE / IFE</option>
                                            <option value="pasaporte">Pasaporte</option>
                                            <option value="cedula">Cédula Profesional</option>
                                            <option value="fm2_3">Forma Migratoria</option>
                                            <option value="acta">Acta Constitutiva</option>
                                            <option value="poder">Poder Notarial</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-5 space-y-1">
                                        <label className="text-xs font-medium text-slate-500">Número / Folio / OCR</label>
                                        <input value={doc.number} onChange={(e) => updateItem('identifications', index, 'number', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm" placeholder="Ej. 1234567890123" />
                                    </div>
                                    <div className="md:col-span-4 space-y-1">
                                        <label className="text-xs font-medium text-slate-500">Vigencia (Vence el...)</label>
                                        <input type="date" value={doc.expires_at} onChange={(e) => updateItem('identifications', index, 'expires_at', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm" />
                                    </div>
                                    <div className="md:col-span-12 space-y-1 mt-2 border-t border-slate-100 pt-2">
                                        <label className="text-xs font-medium text-slate-500 block mb-1">Archivo Digital (PDF/IMG) - Máx 5MB</label>
                                        {doc.file_url ? (
                                            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 w-full md:w-auto inline-flex">
                                                <BadgeCheck className="w-4 h-4" />
                                                <span className="truncate max-w-[200px] font-medium">Archivo Cargado Correctamente</span>
                                                <button type="button" onClick={() => updateItem('identifications', index, 'file_url', null)} className="ml-auto text-slate-400 hover:text-rose-500 p-1 hover:bg-white rounded-full transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        if (file.size > 5 * 1024 * 1024) return alert("El archivo debe pesar menos de 5MB");

                                                        // Upload Logic
                                                        const { data: { user } } = await supabase.auth.getUser();
                                                        if (!user) return alert("Sesión expirada");

                                                        const ext = file.name.split('.').pop();
                                                        const fileName = `${doc.type}_${Date.now()}.${ext}`;
                                                        const filePath = `${user.id}/${fileName}`;

                                                        const { error: uploadError } = await supabase.storage.from('client_docs').upload(filePath, file);

                                                        if (uploadError) {
                                                            alert("Error subiendo: " + uploadError.message);
                                                            return;
                                                        }

                                                        // Get Public URL
                                                        const { data: { publicUrl } } = supabase.storage.from('client_docs').getPublicUrl(filePath);
                                                        updateItem('identifications', index, 'file_url', publicUrl);
                                                    }}
                                                    className="block w-full text-sm text-slate-500
                                                        file:mr-4 file:py-2 file:px-4
                                                        file:rounded-full file:border-0
                                                        file:text-sm file:font-semibold
                                                        file:bg-emerald-50 file:text-emerald-700
                                                        hover:file:bg-emerald-100
                                                        cursor-pointer
                                                    "
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!formData.identifications || (formData.identifications as any[]).length === 0) && (
                            <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg text-slate-500 text-sm">No hay documentos registrados.</div>
                        )}
                    </div>
                )}

                {/* 3. RELACIONES / CONTACTOS */}
                {activeTab === 'contactos' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Nucleo Familiar y Económico</h3>
                                <p className="text-sm text-slate-500">Agrega familiares, socios o pagadores relacionados.</p>
                            </div>
                            <button onClick={addContact} type="button" className="text-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Agregar Persona
                            </button>
                        </div>

                        <div className="space-y-4">
                            {(!formData.related_contacts || (formData.related_contacts as any[]).length === 0) && (
                                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                    <p className="text-slate-500">No hay relaciones registradas.</p>
                                    <button onClick={addContact} type="button" className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium">Agregar la primera</button>
                                </div>
                            )}

                            {(formData.related_contacts as any[])?.map((contact, index) => (
                                <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group transition-all hover:shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => removeContact(index)}
                                        className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                        <div className="md:col-span-4 space-y-1">
                                            <label className="text-xs font-medium text-slate-500">Nombre Completo</label>
                                            <input
                                                value={contact.name}
                                                onChange={(e) => updateContact(index, 'name', e.target.value)}
                                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm capitalize"
                                                placeholder="Ej. Juan Pérez"
                                            />
                                        </div>
                                        <div className="md:col-span-3 space-y-1">
                                            <label className="text-xs font-medium text-slate-500">Parentesco / Relación</label>
                                            <select
                                                value={contact.relation}
                                                onChange={(e) => updateContact(index, 'relation', e.target.value)}
                                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm bg-white"
                                            >
                                                <option value="">Seleccione...</option>
                                                <option value="padre">Padre/Madre</option>
                                                <option value="hijo">Hijo/a</option>
                                                <option value="conyuge">Cónyuge</option>
                                                <option value="socio">Socio Comercial</option>
                                                <option value="empleado">Empleado</option>
                                                <option value="otro">Otro</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-5 grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-500">Email</label>
                                                <input
                                                    value={contact.email}
                                                    onChange={(e) => updateContact(index, 'email', e.target.value)}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm"
                                                    placeholder="email@ejemplo.com"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-slate-500">Teléfono</label>
                                                <input
                                                    value={contact.phone}
                                                    onChange={(e) => updateContact(index, 'phone', e.target.value)}
                                                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-sm"
                                                    placeholder="555-..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center gap-6 pt-3 border-t border-slate-200/50">
                                        <label className="inline-flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={contact.is_payer}
                                                onChange={(e) => updateContact(index, 'is_payer', e.target.checked)}
                                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-sm text-slate-600">Es Pagador</span>
                                        </label>
                                        <label className="inline-flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={contact.notify}
                                                onChange={(e) => updateContact(index, 'notify', e.target.checked)}
                                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="text-sm text-slate-600">Recibe Notificaciones</span>
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. COMUNICACIONES & NOTIFICACIONES */}
                {activeTab === 'comunicaciones' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 flex items-start gap-4">
                            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-emerald-900">Canales de Comunicación</h3>
                                <p className="text-emerald-700/80 text-sm">Configure cómo y dónde quiere que su cliente reciba notificaciones automáticas.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 block ml-1">WhatsApp Principal para Alertas</label>
                                    <PhoneInput
                                        international
                                        defaultCountry="MX"
                                        value={formData.whatsapp || undefined}
                                        onChange={(val) => handlePhoneChange(val, 'whatsapp')}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm"
                                    />
                                    <p className="text-[10px] text-slate-400 italic ml-1">* Se usará para cobranza y recordatorios de renovación.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 block ml-1 flex items-center gap-2">
                                        <div className="p-1 bg-sky-100 rounded text-sky-600">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.35-.49.97-.74 3.81-1.65 6.35-2.74 7.62-3.27 3.63-1.53 4.38-1.8 4.87-1.81.11 0 .35.03.5.16.12.1.16.24.18.33.02.08.02.24.01.32z" /></svg>
                                        </div>
                                        Telegram username o alias
                                    </label>
                                    <input
                                        name="telegram"
                                        value={formData.telegram || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm"
                                        placeholder="@usuario"
                                    />
                                    <p className="text-[10px] text-slate-400 italic ml-1">* Canal alternativo para notificaciones premium.</p>
                                </div>

                                <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                        <BellRing className="w-4 h-4 text-emerald-500" /> Preferencias de Envío
                                    </h4>

                                    <label className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100 transition-all">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-bold text-slate-700">Alertas por WhatsApp</p>
                                            <p className="text-[11px] text-slate-500">Enviar recordatorios de pago automáticamente.</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                            checked={true} // Por ahora harcodeado como default, o usar un campo meta
                                        />
                                    </label>

                                    <label className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100 transition-all">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-bold text-slate-700">Compendio por Email</p>
                                            <p className="text-[11px] text-slate-500">Enviar pólizas y recibos al correo principal.</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                            checked={true}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-5 bg-slate-900 rounded-2xl text-white shadow-xl">
                                    <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4">Estado del Cliente</h4>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                            <span className="text-xs text-slate-400">RFC</span>
                                            <span className="text-sm font-mono font-bold text-emerald-300">{formData.rfc || 'PENDIENTE'}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                            <span className="text-xs text-slate-400">Régimen Fiscal</span>
                                            <span className="text-xs font-bold">{formData.fiscal_regime || 'POR DEFINIR'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-slate-400">Nivel de Confianza</span>
                                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold">PLATINUM</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 border border-dashed border-slate-200 rounded-2xl space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notas de Bitácora</p>
                                    <textarea
                                        className="w-full h-24 bg-transparent text-sm text-slate-600 outline-none resize-none"
                                        placeholder="Historial de contacto manual..."
                                        value={formData.notes || ''}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </form>
        </div>
    )
}
