import { AdminControls } from '@/components/AdminControls';
import { useSitePageContext } from '@/hooks/useSitePageContext';

export function AdminPortalPage() {
  const {
    auth,
    isAdmin,
    isEditing,
    isPreviewMode,
    siteData,
    saving,
    setPreviewMode,
    setEditing,
    addAdminEmail,
    removeAdminEmail,
  } = useSitePageContext();

  return (
    <AdminControls
      isAdmin={isAdmin}
      isEditing={isEditing}
      isPreviewMode={isPreviewMode}
      saving={saving}
      currentUserEmail={auth.user?.email ?? null}
      adminEmails={siteData.adminEmails}
      settings={siteData.settings}
      onSetEditing={setEditing}
      onSetPreviewMode={setPreviewMode}
      onAddAdmin={async (email) => {
        await addAdminEmail({
          id: crypto.randomUUID(),
          email,
          addedByEmail: auth.user?.email ?? email,
        });
      }}
      onRemoveAdmin={removeAdminEmail}
      onSignOut={auth.signOut}
    />
  );
}
