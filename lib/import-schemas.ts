export const IMPORT_SCHEMAS = {
    clients: [
        { key: 'first_name', label: 'Nombre(s)', required: true, description: 'Nombres de pila de la persona' },
        { key: 'last_name', label: 'Apellidos', required: true, description: 'Apellidos completos' },
        { key: 'email', label: 'Correo Electrónico', required: false, description: 'Email de contacto' },
        { key: 'phone', label: 'Teléfono / WhatsApp', required: false, description: 'Número de 10 dígitos' },
        { key: 'rfc', label: 'RFC', required: false, description: 'Registro Federal de Contribuyentes (México)' },
        { key: 'notes', label: 'Notas / Comentarios', required: false, description: 'Cualquier observación adicional' }
    ],
    policies: [
        { key: 'policy_number', label: 'No. Póliza', required: true, description: 'Número identificador único de la póliza' },
        { key: 'client_name', label: 'Nombre del Cliente', required: true, description: 'Nombre completo del asegurado para búsqueda' },
        { key: 'insurer_name', label: 'Aseguradora', required: true, description: 'Nombre de la compañía de seguros' },
        { key: 'branch_name', label: 'Ramo', required: false, description: 'Tipo de seguro (Autos, Vida, GMM, etc.)' },
        { key: 'start_date', label: 'Inicio Vigencia', required: true, description: 'Fecha de inicio del seguro' },
        { key: 'end_date', label: 'Fin Vigencia', required: true, description: 'Fecha de término del seguro' },
        { key: 'premium_total', label: 'Prima Total', required: false, description: 'Costo total de la póliza con impuestos' },
        { key: 'payment_method', label: 'Forma de Pago', required: false, description: 'Mensual, Semestral, Anual, etc.' }
    ]
}
