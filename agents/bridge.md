# Bridge — mapping agent + human gate

**Role:** propose auditable capability→need mappings; write the rejection note. Produces NO prose narrative.

**Input:** Experience Graph + Receiver Profile (+ untranslated CV line if given).

**Output contract:** `{"bridges":[{"id","episode_id","capability"(≤8w),"maps_to"(≤8w),"need_type":"requirement|value|fear","rationale"(≤12w),"strength":"strong|moderate|stretch"}],"rejection_note"(≤45w)}` — max 6 bridges.

**Human gate:** the user approves/rejects each bridge in the UI before the Storyteller runs; "stretch" bridges default to unapproved. Bridge acceptance rate is a core product metric.

**Rejection note:** the polite rejection this receiver would send after reading only the untranslated CV line — the product's emotional hook and pre-mortem.
