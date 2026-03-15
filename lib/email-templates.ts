export const EMAIL_TEMPLATES = {
    PRIVACY_NOTICE: `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 11px; font-family: sans-serif; line-height: 1.4;">
            <p><strong>AVISO DE PRIVACIDAD SIMPLIFICADO:</strong> Los datos personales aquí recabados serán utilizados con la finalidad de brindarle el servicio de asesoría y gestión de seguros solicitado. Para conocer nuestro aviso de privacidad integral, por favor solicítelo a su agente de seguros o visite nuestro portal oficial.</p>
            <p>Este mensaje y sus archivos adjuntos van dirigidos exclusivamente a su destinatario. Si usted no es el destinatario, queda prohibida cualquier copia o distribución del mismo.</p>
        </div>
    `,
    NEW_POLICY: (clientName: string, policyNumber: string, insurer: string, branch?: string, startDate?: string, endDate?: string) => `
        <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 50px 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">¡Tu protección está lista!</h1>
                <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px; font-weight: 500;">Bienvenido a la red de seguridad de RB Proyectos</p>
            </div>
            <div style="padding: 40px 35px; line-height: 1.7;">
                <p style="font-size: 16px; margin-bottom: 25px;">Estimado(a) <strong>${clientName}</strong>,</p>
                <p style="margin-bottom: 25px;">Es un gusto saludarte. Te adjuntamos tu nueva póliza de <strong>${insurer}</strong>. Aquí tienes los datos principales para tu referencia rápida:</p>
                
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; margin: 30px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase;">Ramo / Plan</td>
                            <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 700; font-size: 14px;">${branch || 'General'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase;">N° de Póliza</td>
                            <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 700; font-size: 14px;">${policyNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding: 15px 0 0; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; border-top: 1px solid #e2e8f0;">Vigencia Actual</td>
                            <td style="padding: 15px 0 0; text-align: right; color: #0f172a; font-weight: 800; font-size: 14px; border-top: 1px solid #e2e8f0;">
                                ${startDate ? `Del ${startDate} ` : ''}${endDate ? `al ${endDate}` : ''}
                            </td>
                        </tr>
                    </table>
                </div>

                {{VIDEO_CTA}}
                {{CUSTOM_MESSAGE}}

                <p style="margin-top: 25px;">Recuerda que puedes consultar todos los detalles de tu cobertura desde nuestro portal de clientes 360 en cualquier momento.</p>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="{{PORTAL_URL}}" style="background: #059669; color: white; padding: 18px 36px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 10px 20px rgba(5, 150, 105, 0.2); display: inline-block;">Ver mi Póliza Online</a>
                </div>
                
                <div style="padding-top: 30px; border-top: 1px solid #f1f5f9; text-align: center;">
                    <p style="color: #64748b; font-size: 14px; margin: 0;">Si tiene alguna duda o comentario, no dude en contactarnos. Quedo a sus órdenes.</p>
                </div>
            </div>
            <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                Este correo fue enviado automáticamente por tu Agente Digital a través de RB Proyectos.
            </div>
        </div>
    `,
    RENEWAL: (clientName: string, policyNumber: string, expiryDate: string, insurer: string, branch: string, startDate?: string) => `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 50px 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">Reporte de Renovación</h1>
                <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px; font-weight: 500;">Protección Patrimonial Continua</p>
            </div>
            <div style="padding: 40px 35px; line-height: 1.7;">
                <p style="font-size: 16px; margin-bottom: 25px;">Estimado(a) <strong>${clientName}</strong>,</p>
                <p style="margin-bottom: 25px;">Es un gusto saludarte. Te informamos que hemos preparado la renovación de tu póliza con <strong>${insurer}</strong>. A continuación, te presentamos el resumen detallado de tu nueva cobertura:</p>
                
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; margin: 30px 0;">
                    <h3 style="margin: 0 0 15px 0; font-size: 12px; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px; font-weight: 900;">Información de la Póliza</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase;">Aseguradora</td>
                            <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 700; font-size: 14px;">${insurer}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase;">Ramo / Plan</td>
                            <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 700; font-size: 14px;">${branch}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase;">N° de Póliza</td>
                            <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 700; font-size: 14px;">${policyNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding: 15px 0 0; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; border-top: 1px solid #e2e8f0;">Vigencia</td>
                            <td style="padding: 15px 0 0; text-align: right; color: #0f172a; font-weight: 800; font-size: 14px; border-top: 1px solid #e2e8f0;">
                                ${startDate ? `Del ${startDate} ` : ''}al ${expiryDate}
                            </td>
                        </tr>
                    </table>
                </div>

                {{INSTALLMENTS_TABLE}}

                {{VIDEO_CTA}}
                {{CUSTOM_MESSAGE}}

                <p style="margin-top: 25px;">Apreciamos sinceramente la confianza que has depositado en nosotros para resguardar tu patrimonio. Nuestro compromiso es brindarte seguridad y tranquilidad en todo momento.</p>
                
                <div style="text-align: center; margin: 40px 0;">
                    <a href="{{PORTAL_URL}}" style="background: #4f46e5; color: white; padding: 18px 36px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 10px 20px rgba(79, 70, 229, 0.2); display: inline-block;">Revisar mi Póliza en el Portal</a>
                </div>
                
                <div style="padding-top: 30px; border-top: 1px solid #f1f5f9; text-align: center;">
                    <p style="color: #64748b; font-size: 14px; margin: 0;">Si tiene alguna duda o comentario, no dude en contactarnos. Quedo a sus órdenes.</p>
                </div>
            </div>
            <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                Este correo es un aviso oficial emitido por RB Proyectos.
            </div>
        </div>
    `,
    PRE_RENEWAL: (clientName: string, policyNumber: string, expiryDate: string, insurer?: string, branch?: string, startDate?: string) => `
        <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); padding: 50px 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">Próxima Renovación</h1>
                <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px; font-weight: 500;">Anticipando tu protección patrimonial</p>
            </div>
            <div style="padding: 40px 35px; line-height: 1.7;">
                <p style="font-size: 16px; margin-bottom: 25px;">Estimado(a) <strong>${clientName}</strong>,</p>
                <p style="margin-bottom: 25px;">Te saludamos con el gusto de siempre. Queremos informarte que tu protección actual vencerá próximamente. Estamos trabajando proactivamente para garantizar tu tranquilidad:</p>
                
                <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 16px; padding: 25px; margin: 30px 0;">
                    <h3 style="margin: 0 0 15px 0; font-size: 11px; color: #0284c7; text-transform: uppercase; letter-spacing: 1px; font-weight: 900;">Detalles de la Póliza Actual</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase;">Aseguradora</td>
                            <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 700; font-size: 14px;">${insurer || 'Compañía Actual'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase;">Ramo / Plan</td>
                            <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 700; font-size: 14px;">${branch || 'Seguro Vigente'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase;">N° de Póliza</td>
                            <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 700; font-size: 14px;">${policyNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding: 15px 0 0; color: #0284c7; font-size: 11px; font-weight: 800; text-transform: uppercase; border-top: 1px solid #bae6fd;">Fin de Vigencia</td>
                            <td style="padding: 15px 0 0; text-align: right; color: #0284c7; font-weight: 800; font-size: 15px; border-top: 1px solid #bae6fd;">${expiryDate}</td>
                        </tr>
                    </table>
                </div>

                {{VIDEO_CTA}}
                {{CUSTOM_MESSAGE}}

                <p style="margin-top: 25px;">Muy pronto nos pondremos en contacto contigo para presentarte la propuesta de renovación que mejor se adapte a tus necesidades actuales.</p>
                
                <div style="padding-top: 30px; border-top: 1px solid #f1f5f9; text-align: center;">
                    <p style="color: #64748b; font-size: 14px; margin: 0;">Si tiene alguna duda o comentario, no dude en contactarnos. Quedo a sus órdenes.</p>
                </div>
            </div>
            <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                RB Proyectos • Tu tranquilidad, nuestra misión.
            </div>
        </div>
    `,
    OVERDUE: (clientName: string, policyNumber: string, insurer?: string, branch?: string, totalPremium?: string) => `
        <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #fecaca; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(225, 29, 72, 0.08);">
            <div style="background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); padding: 50px 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">Aviso Crítico de Pago</h1>
                <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px; font-weight: 500;">Acción Requerida Inmediata</p>
            </div>
            <div style="padding: 40px 35px; line-height: 1.7;">
                <p style="font-size: 16px; margin-bottom: 25px;">Estimado(a) <strong>${clientName}</strong>,</p>
                <p style="margin-bottom: 25px;">Hemos detectado un retraso en el pago de tu protección. Es vital regularizar esta situación para mantener tu cobertura activa y evitar cualquier riesgo de cancelación.</p>
                
                <div style="background: #fff1f2; border: 1px solid #fecaca; border-radius: 16px; padding: 25px; margin: 30px 0;">
                    <h3 style="margin: 0 0 15px 0; font-size: 11px; color: #e11d48; text-transform: uppercase; letter-spacing: 1px; font-weight: 900;">Información de Seguimiento</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase;">Aseguradora</td>
                            <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 700; font-size: 14px;">${insurer || 'Compañía Actual'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase;">Ramo / Plan</td>
                            <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 700; font-size: 14px;">${branch || 'Seguro Vigente'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase;">N° de Póliza</td>
                            <td style="padding: 8px 0; text-align: right; color: #0f172a; font-weight: 700; font-size: 14px;">${policyNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding: 15px 0 0; color: #e11d48; font-size: 11px; font-weight: 800; text-transform: uppercase; border-top: 1px solid #fecaca;">Monto Pendiente</td>
                            <td style="padding: 15px 0 0; text-align: right; color: #e11d48; font-weight: 800; font-size: 15px; border-top: 1px solid #fecaca;">$${totalPremium || '0.00'}</td>
                        </tr>
                    </table>
                </div>

                {{VIDEO_CTA}}
                {{CUSTOM_MESSAGE}}

                <div style="text-align: center; margin: 40px 0;">
                    <a href="{{PORTAL_URL}}" style="background: #e11d48; color: white; padding: 18px 36px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 10px 20px rgba(225, 29, 72, 0.2); display: inline-block;">Ver Detalle de Pago en el Portal</a>
                </div>
                
                <div style="padding-top: 30px; border-top: 1px solid #f1f5f9; text-align: center;">
                    <p style="color: #64748b; font-size: 14px; margin: 0;">Si tiene alguna duda o comentario, no dude en contactarnos. Quedo a sus órdenes.</p>
                </div>
            </div>
        </div>
    `,
    BIRTHDAY: (clientName: string) => `
        <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 50px 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">¡Feliz Cumpleaños! 🎂</h1>
                <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px; font-weight: 500;">Celebrando un año más de vida y éxitos</p>
            </div>
            <div style="padding: 40px 35px; line-height: 1.7;">
                {{BIRTHDAY_IMAGE}}

                <p style="font-size: 18px; margin-bottom: 25px; text-align: center; color: #4f46e5; font-weight: 700;">¡Muchas felicidades, ${clientName}!</p>
                <p style="margin-bottom: 25px; text-align: center;">En **RB Proyectos** nos sentimos honrados de acompañarte en cada etapa de tu vida. Hoy celebramos contigo y te deseamos un día lleno de alegría, rodeado de tus seres más queridos.</p>
                
                <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 16px; padding: 25px; margin: 30px 0; text-align: center;">
                    <p style="margin: 0; color: #7c3aed; font-weight: 800; font-size: 16px;">Gracias por la confianza de permitirnos proteger lo que más valoras.</p>
                </div>

                {{CUSTOM_MESSAGE}}

                <div style="padding-top: 30px; border-top: 1px solid #f1f5f9; text-align: center; margin-top: 30px;">
                    <p style="color: #64748b; font-size: 14px; margin: 0;">Que este nuevo año venga cargado de salud y prosperidad.</p>
                    <p style="color: #4f46e5; font-weight: 700; margin-top: 10px;">Atentamente, tu equipo de RB Proyectos</p>
                </div>
            </div>
            <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                Si tiene alguna duda o comentario, no dude en contactarnos. Quedo a sus órdenes.
            </div>
        </div>
    `,
    GENERAL_MESSAGE: (clientName: string) => `
        <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 50px 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">Seguimiento de Protección</h1>
                <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px; font-weight: 500;">RB Proyectos • Siempre a tu servicio</p>
            </div>
            <div style="padding: 40px 35px; line-height: 1.7;">
                <p style="font-size: 16px; margin-bottom: 25px;">Estimado(a) <strong>${clientName}</strong>,</p>
                
                {{VIDEO_CTA}}
                {{CUSTOM_MESSAGE}}

                <div style="padding-top: 30px; border-top: 1px solid #f1f5f9; text-align: center; margin-top: 30px;">
                    <p style="color: #64748b; font-size: 14px; margin: 0;">Si tiene alguna duda o comentario, no dude en contactarnos. Quedo a sus órdenes.</p>
                </div>
            </div>
            <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                Este mensaje fue enviado por tu Agente de Seguros a través de RB Proyectos.
            </div>
        </div>
    `,
    VIDEO_CTA: (url: string) => `
        <div style="margin: 30px 0; background-color: #f1f5f9; padding: 25px; border-radius: 24px; border: 1px dashed #cbd5e1; text-align: center;">
            <p style="color: #64748b; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 15px;">Video-Propuesta Personalizada</p>
            <a href="${url}" style="display: inline-block; background-color: #ef4444; color: white; padding: 12px 25px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);">
                ▶ Ver mi presentación en video
            </a>
            <p style="color: #94a3b8; font-size: 9px; margin-top: 12px; font-weight: 600;">Haz clic para visualizar los detalles explicados por tu agente.</p>
        </div>
    `
};
