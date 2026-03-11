'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import {
    Users, Plus, Search, Mail, Shield,
    MoreHorizontal, Edit2, Trash2, CheckCircle,
    XCircle, UserPlus, ShieldAlert,
    RotateCcw
} from 'lucide-react';
import { cn, getAvatarUrl } from '@/lib/utils';
import UsuarioModal from '@/components/modals/UsuarioModal';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface Usuario {
    id: string;
    nome: string;
    email: string;
    perfil: string;
    ativo: boolean;
    createdAt: string;
    avatar?: string;
}

export default function EquipePage() {
    const { usuario: currentUser } = useAuth();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);

    const fetchUsuarios = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (data.success) {
                setUsuarios(data.data);
            }
        } catch (error) {
            toast.error('Erro ao carregar equipe');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const handleEdit = (u: Usuario) => {
        setSelectedUsuario(u);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setSelectedUsuario(null);
        setIsModalOpen(true);
    };

    const filteredUsuarios = usuarios.filter(u =>
        u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full animate-fade-in pb-20 md:pb-0">
            <Header
                title="Gestão da Equipe"
                subtitle="Gerencie os usuários e permissões da sua clínica"
                actions={
                    <button onClick={handleNew} className="btn-primary py-1.5 px-3 text-xs gap-1">
                        <UserPlus className="w-3.5 h-3.5" />
                        Adicionar Membro
                    </button>
                }
            />

            <div className="p-4 space-y-4 flex-1 overflow-y-auto max-w-6xl mx-auto w-full">
                {/* Search and Filters */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou e-mail..."
                            className="input pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredUsuarios.map((u) => (
                            <div key={u.id} className="card group relative hover:border-primary/30 transition-all duration-300">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={u.avatar || getAvatarUrl(u.nome)}
                                            alt={u.nome}
                                            className="w-12 h-12 rounded-full object-cover border-2 border-border"
                                        />
                                        <div>
                                            <h3 className="text-sm font-bold text-text truncate max-w-[150px]">{u.nome}</h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                                                    u.perfil === 'ADMIN' ? "bg-primary/10 text-primary" : "bg-secondary text-text-muted"
                                                )}>
                                                    {u.perfil}
                                                </span>
                                                {u.id === currentUser?.id && (
                                                    <span className="px-1.5 py-0.5 rounded-full bg-success/10 text-success text-[9px] font-bold">VOCÊ</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleEdit(u)}
                                        className="p-1.5 hover:bg-secondary rounded-lg text-text-muted transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-text-muted">
                                        <Mail className="w-3 h-3" />
                                        <span className="truncate">{u.email}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-border mt-3">
                                        <span className="text-[10px] text-text-light font-medium">
                                            Desde {new Date(u.createdAt).toLocaleDateString()}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {u.ativo ? (
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-success">
                                                    <CheckCircle className="w-3 h-3" />
                                                    ATIVO
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-[10px] font-bold text-error">
                                                    <XCircle className="w-3 h-3" />
                                                    INATIVO
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredUsuarios.length === 0 && (
                            <div className="col-span-full py-20 bg-white rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center px-4">
                                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-text-muted mb-4">
                                    <Users className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-text">Nenhum membro encontrado</h3>
                                <p className="text-sm text-text-muted mt-1 max-w-xs">
                                    Nenhum usuário corresponde à sua busca ou sua equipe ainda não possui membros cadastrados.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <UsuarioModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchUsuarios}
                usuario={selectedUsuario}
            />
        </div>
    );
}
