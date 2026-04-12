import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatMoney } from '../utils/whatsapp';

export default function AdminPage() {
  const { state, actions } = useApp();
  const [tab, setTab] = useState('settings');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });

  if (!state.isAdminAuthenticated) {
    return (
      <section className="page admin-page">
        <div className="auth-card card">
          <p className="eyebrow">Acceso de administracion</p>
          <h1>Ingresa para configurar el catalogo</h1>
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault();
              actions.login(authForm.email, authForm.password);
            }}
          >
            <input
              value={authForm.email}
              onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Correo"
            />
            <input
              value={authForm.password}
              onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Contrasena"
              type="password"
            />
            {state.notice ? <p className="notice error">{state.notice}</p> : null}
            <button type="submit" className="primary-button">
              Entrar
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="page admin-page">
      <div className="admin-header card">
        <div>
          <p className="eyebrow">Panel de administracion</p>
          <h1>Administra productos, categorias, imagenes y datos de contacto</h1>
        </div>
        <button type="button" className="secondary-button" onClick={actions.logout}>
          Cerrar sesion
        </button>
      </div>

      <div className="tabs">
        <button type="button" className={tab === 'settings' ? 'chip active' : 'chip'} onClick={() => setTab('settings')}>
          Configuracion
        </button>
        <button type="button" className={tab === 'categories' ? 'chip active' : 'chip'} onClick={() => setTab('categories')}>
          Categorias
        </button>
        <button type="button" className={tab === 'products' ? 'chip active' : 'chip'} onClick={() => setTab('products')}>
          Productos
        </button>
      </div>

      {tab === 'settings' ? <SettingsPanel /> : null}
      {tab === 'categories' ? <CategoriesPanel /> : null}
      {tab === 'products' ? <ProductsPanel /> : null}
    </section>
  );
}

function SettingsPanel() {
  const { state, actions } = useApp();
  const [form, setForm] = useState(state.settings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setForm(state.settings);
  }, [state.settings]);

  return (
    <form
      className="admin-panel card"
      onSubmit={async (event) => {
        event.preventDefault();
        try {
          setSaving(true);
          await actions.updateSettings(form);
          setMessage('Configuración guardada.');
        } catch (error) {
          setMessage(`No se pudo guardar configuración: ${error.message}`);
        } finally {
          setSaving(false);
        }
      }}
    >
      <h2>Configuracion general</h2>
      <div className="form-grid">
        <input
          value={form.storeName}
          onChange={(event) => setForm((current) => ({ ...current, storeName: event.target.value }))}
          placeholder="Nombre de la tienda"
        />
        <input
          value={form.whatsappPhone}
          onChange={(event) => setForm((current) => ({ ...current, whatsappPhone: event.target.value }))}
          placeholder="Numero de WhatsApp"
        />
      </div>
      <textarea
        value={form.description}
        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
        placeholder="Descripcion de la tienda"
      />
      <button type="submit" className="primary-button" disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar configuracion'}
      </button>
      {message ? <p className="notice">{message}</p> : null}
    </form>
  );
}

function CategoriesPanel() {
  const { state, actions } = useApp();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  return (
    <div className="admin-grid">
      <form
        className="admin-panel card"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            setSaving(true);
            await actions.addCategory(name);
            setName('');
            setMessage('Categoría creada.');
          } catch (error) {
            setMessage(`No se pudo crear categoría: ${error.message}`);
          } finally {
            setSaving(false);
          }
        }}
      >
        <h2>Nueva categoria</h2>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre de la categoria" />
        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? 'Creando...' : 'Crear categoria'}
        </button>
        {message ? <p className="notice">{message}</p> : null}
      </form>

      <div className="admin-panel card">
        <h2>Categorias existentes</h2>
        <div className="stack-list">
          {state.categories.map((category) => (
            <div key={category.id} className="list-row">
              <div>
                <strong>{category.name}</strong>
                <span>{category.slug}</span>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={async () => {
                  try {
                    setSaving(true);
                    await actions.removeCategory(category.id);
                    setMessage('Categoría eliminada.');
                  } catch (error) {
                    setMessage(`No se pudo eliminar categoría: ${error.message}`);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductsPanel() {
  const { state, actions } = useApp();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(createEmptyProduct(state.categories[0]?.id || ''));
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!editingId) {
      setForm(createEmptyProduct(state.categories[0]?.id || ''));
    }
  }, [editingId, state.categories]);

  const startEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      image: product.image,
      categoryId: product.categoryId,
    });
  };

  const onCancel = () => {
    setEditingId(null);
    setForm(createEmptyProduct(state.categories[0]?.id || ''));
  };

  const hasCategories = state.categories.length > 0;
  const categoriesOptions = useMemo(() => state.categories, [state.categories]);

  return (
    <div className="admin-grid admin-grid-wide">
      <form
        className="admin-panel card"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!hasCategories) {
            return;
          }

          try {
            setIsSaving(true);
            if (editingId) {
              await actions.updateProduct(editingId, form);
              setMessage('Producto actualizado.');
            } else {
              await actions.addProduct(form);
              setMessage('Producto creado.');
            }
            onCancel();
          } catch (error) {
            setMessage(`No se pudo guardar producto: ${error.message}`);
          } finally {
            setIsSaving(false);
          }
        }}
      >
        <h2>{editingId ? 'Editar producto' : 'Nuevo producto'}</h2>
        <div className="form-grid">
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Nombre"
          />
          <select
            value={form.categoryId}
            onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
            disabled={!hasCategories}
          >
            {categoriesOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            value={form.price}
            onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
            placeholder="Precio"
            type="number"
            min="0"
          />
          <input
            value={form.stock}
            onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
            placeholder="Cantidad disponible"
            type="number"
            min="0"
          />
        </div>
        <textarea
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          placeholder="Descripcion"
        />
        <input
          value={form.image}
          onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
          placeholder="URL o data URI de la imagen"
        />
        <label className="secondary-button" style={{ display: 'inline-flex', justifyContent: 'center', cursor: 'pointer' }}>
          {isUploadingImage ? 'Subiendo imagen...' : 'Subir imagen'}
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;

              try {
                setIsUploadingImage(true);
                const imageUrl = await actions.uploadProductImage(file);
                setForm((current) => ({ ...current, image: imageUrl }));
                setMessage('Imagen subida correctamente.');
              } catch (error) {
                setMessage(`No se pudo subir imagen: ${error.message}`);
              } finally {
                setIsUploadingImage(false);
                event.target.value = '';
              }
            }}
          />
        </label>
        {!hasCategories ? <p className="notice error">Primero crea al menos una categoria para agregar productos.</p> : null}
        {message ? <p className="notice">{message}</p> : null}
        <div className="button-row">
          <button type="submit" className="primary-button" disabled={!hasCategories || isSaving || isUploadingImage}>
            {isSaving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Agregar producto'}
          </button>
          {editingId ? (
            <button type="button" className="secondary-button" onClick={onCancel} disabled={isSaving || isUploadingImage}>
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      <div className="admin-panel card">
        <h2>Productos existentes</h2>
        <div className="stack-list">
          {state.products.map((product) => (
            <div key={product.id} className="list-row list-row-products">
              <img src={product.image} alt={product.name} />
              <div>
                <strong>{product.name}</strong>
                <span>{product.description}</span>
                <span>
                  {formatMoney(product.price)} - Stock {product.stock}
                </span>
              </div>
              <div className="button-row">
                <button type="button" className="secondary-button" onClick={() => startEdit(product)}>
                  Editar
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={async () => {
                    try {
                      setIsSaving(true);
                      await actions.removeProduct(product.id);
                      setMessage('Producto eliminado.');
                    } catch (error) {
                      setMessage(`No se pudo eliminar producto: ${error.message}`);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving || isUploadingImage}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function createEmptyProduct(categoryId) {
  return {
    name: '',
    description: '',
    price: '0',
    stock: '0',
    image: '',
    categoryId,
  };
}
