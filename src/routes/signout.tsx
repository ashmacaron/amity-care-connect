import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signout")({
  component: Signout,
});

function Signout() {
  useEffect(() => {
    supabase.auth.signOut().then(() => {
      window.location.replace("https://amity-care-connect.ashacipriano.workers.dev/");
    });
  }, []);

  return null;
}
