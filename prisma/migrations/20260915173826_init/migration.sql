-- CreateEnum
CREATE TYPE "TipoItem" AS ENUM ('SERVICIO', 'PRODUCTO');

-- CreateEnum
CREATE TYPE "EstadoCodigo" AS ENUM ('EMITIDO', 'CANJEADO');

-- CreateTable
CREATE TABLE "categorias" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoItem" NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "tipo" "TipoItem" NOT NULL,
    "imagen_url" TEXT NOT NULL,
    "beneficios" TEXT[],
    "ficha_tecnica" JSONB,
    "categoria_id" UUID NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fecha_evento" TIMESTAMPTZ(3) NOT NULL,
    "confirmado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_token" TEXT NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "selecciones_items" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,

    CONSTRAINT "selecciones_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codigos_descuento" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "TipoItem" NOT NULL,
    "porcentaje" INTEGER NOT NULL,
    "estado" "EstadoCodigo" NOT NULL DEFAULT 'EMITIDO',
    "cliente_id" UUID NOT NULL,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canjeado_en" TIMESTAMPTZ(3),

    CONSTRAINT "codigos_descuento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" UUID NOT NULL,
    "usuario" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "items_nombre_key" ON "items"("nombre");

-- CreateIndex
CREATE INDEX "items_categoria_id_idx" ON "items"("categoria_id");

-- CreateIndex
CREATE INDEX "items_tipo_idx" ON "items"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_session_token_key" ON "clientes"("session_token");

-- CreateIndex
CREATE INDEX "selecciones_items_item_id_idx" ON "selecciones_items"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "selecciones_items_cliente_id_item_id_key" ON "selecciones_items"("cliente_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "codigos_descuento_codigo_key" ON "codigos_descuento"("codigo");

-- CreateIndex
CREATE INDEX "codigos_descuento_cliente_id_idx" ON "codigos_descuento"("cliente_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_usuario_key" ON "admins"("usuario");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "selecciones_items" ADD CONSTRAINT "selecciones_items_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "selecciones_items" ADD CONSTRAINT "selecciones_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codigos_descuento" ADD CONSTRAINT "codigos_descuento_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
