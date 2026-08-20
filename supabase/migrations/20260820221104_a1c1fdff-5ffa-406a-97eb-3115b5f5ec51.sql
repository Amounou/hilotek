-- Révoquer l'exécution directe des fonctions internes (triggers) pour les rôles applicatifs
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_apply_movement() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_booking_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_decrement_stock() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_invoice_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_memoire_balance_upd() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_memoire_history() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_memoire_setup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_order_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_proforma_item_line() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_proforma_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_proforma_recalc() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_quote_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_repair_history() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_repair_setup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_sale_item_line() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_sale_item_stock() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_sale_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_sale_recalc() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;

-- Conserver l'accès aux fonctions intentionnellement publiques
GRANT EXECUTE ON FUNCTION public.get_public_settings() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, public.app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_memoire(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_repair(text) TO anon, authenticated;