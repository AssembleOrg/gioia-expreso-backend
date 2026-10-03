-- Seguimiento con Rumbo: cada cambio que ve el comprador deja una fila en
-- rumbo_outbox y avisa por NOTIFY. El módulo rumbo del backend la procesa.
-- Sólo agrega: no modifica tablas ni datos existentes.

CREATE TABLE "rumbo_outbox" (
    "id" BIGSERIAL NOT NULL,
    "preorderId" TEXT,
    "containerId" TEXT,
    "reason" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rumbo_outbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rumbo_outbox_processedAt_nextAttemptAt_idx" ON "rumbo_outbox"("processedAt", "nextAttemptAt");

-- Preórdenes: alta, cambio de estado o borrado lógico.
CREATE FUNCTION rumbo_outbox_preorder() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT'
     OR NEW."status" IS DISTINCT FROM OLD."status"
     OR NEW."deletedAt" IS DISTINCT FROM OLD."deletedAt" THEN
    INSERT INTO "rumbo_outbox" ("preorderId", "reason") VALUES (NEW."id", 'preorder:' || lower(TG_OP));
    PERFORM pg_notify('rumbo_outbox', '');
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "rumbo_outbox_preorders"
AFTER INSERT OR UPDATE ON "preorders"
FOR EACH ROW EXECUTE FUNCTION rumbo_outbox_preorder();

-- Repartos: cambio de estado (carga, viaje, llegada) o borrado lógico.
CREATE FUNCTION rumbo_outbox_container() RETURNS trigger AS $$
BEGIN
  IF NEW."status" IS DISTINCT FROM OLD."status"
     OR NEW."deletedAt" IS DISTINCT FROM OLD."deletedAt" THEN
    INSERT INTO "rumbo_outbox" ("containerId", "reason") VALUES (NEW."id", 'container:status');
    PERFORM pg_notify('rumbo_outbox', '');
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "rumbo_outbox_containers"
AFTER UPDATE ON "containers"
FOR EACH ROW EXECUTE FUNCTION rumbo_outbox_container();

-- Un paquete entra a un reparto o sale de él (también al borrar el reparto).
CREATE FUNCTION rumbo_outbox_container_preorder() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO "rumbo_outbox" ("preorderId", "containerId", "reason")
    VALUES (OLD."preorderId", OLD."containerId", 'container_preorder:delete');
  ELSE
    INSERT INTO "rumbo_outbox" ("preorderId", "containerId", "reason")
    VALUES (NEW."preorderId", NEW."containerId", 'container_preorder:insert');
  END IF;
  PERFORM pg_notify('rumbo_outbox', '');
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "rumbo_outbox_container_preorders"
AFTER INSERT OR DELETE ON "container_preorders"
FOR EACH ROW EXECUTE FUNCTION rumbo_outbox_container_preorder();

-- Carga inicial: las preórdenes que siguen en curso entran a Rumbo. Las ya
-- completadas o canceladas no (aparecerían entregadas "hoy").
INSERT INTO "rumbo_outbox" ("preorderId", "reason")
SELECT "id", 'backfill' FROM "preorders"
WHERE "deletedAt" IS NULL AND "status" NOT IN ('COMPLETED', 'CANCELLED');
