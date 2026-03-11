# Relatório de Prontidão para Produção (Ready for Production)

Este documento detalha o estado atual do sistema CRM Clínica e o que é necessário para o deploy em um ambiente de produção (ex: Vercel).

## 1. Banco de Dados [CONCLUÍDO] ✅
- [x] Migração de SQLite para PostgreSQL (Supabase).
- [x] Configuração de Connection String (`DATABASE_URL`).
- [x] Schema estruturado (Multi-tenant, Auth, Kanban dinâmico, Clientes).

## 2. Autenticação e Segurança [CONCLUÍDO] ✅
- [x] Middleware protegido (`withAuth`).
- [x] Autenticação segura via Cookies (`httpOnly` via rota de login).
- [x] Isolamento de dados por Tenant (`clinicaId`).
- [x] Opcional p/ Produção: Alterar senhas secretas `JWT_SECRET` e `NEXTAUTH_SECRET` por gerar hashes seguras.

## 3. WhatsApp (Evolution API) [CONCLUÍDO] ✅
- [x] Conexão consolidada rodando num servidor VPS estável.
- [x] Instâncias criadas e removidas dinamicamente (com setup de QR Code).
- [ ] OBRIGATÓRIO p/ Produção: Atualizar o domínio do Webhook na variável `APP_URL` ou na criação da instância, apontando para o seu domínio da Vercel (`https://suaclinica.vercel.app/api/webhook/whatsapp`).

## 4. Gestão de Arquivos e Mídia [CONCLUÍDO] ✅
- [x] Os arquivos e gravações de áudio são enviados diretamente para o Supabase Storage.
- [x] Implementada a integração com Supabase Storage no utilitário (`src/lib/storage.ts`).

## 5. Próximos Passos (Deploy na Vercel) 🚀
1. Criar novo projeto na Vercel e conectar seu repositório GitHub.
2. Adicionar as **Variáveis de Ambiente (.env)** no painel da Vercel.
3. Obter a URL de produção (Ex: `https://meucrm.vercel.app`) e atualizar a variável `NEXT_PUBLIC_APP_URL`.
4. Refazer o login com o WhatsApp (gerar novo QR Code) para que a Evolution API cadastre o Webhook com a URL de produção correta.
