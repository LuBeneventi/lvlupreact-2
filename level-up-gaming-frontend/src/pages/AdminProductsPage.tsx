// level-up-gaming-frontend/src/pages/AdminProductsPage.tsx (CÓDIGO FINAL CORREGIDO)

import React, { useState, useEffect, FormEvent } from 'react';
import { Container, Table, Alert, Spinner, Badge, Button, Modal, Row, Col, Form, Card, ButtonGroup } from 'react-bootstrap';
import { Edit, ArrowLeft, PlusCircle, AlertTriangle, ToggleLeft, ToggleRight } from 'react-feather';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Product } from '../types/Product';

import AdminLayout from '../layouts/AdminLayout'; 

// ------------------ CONSTANTES -------------------
const CLP_FORMATTER = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 });
const formatClp = (amount: number) => CLP_FORMATTER.format(amount);

const API_URL = '/api/products';
const CATEGORIES = ['Consolas', 'Juegos', 'Accesorios', 'Laptops', 'Computadores', 'Juegos de Mesa'];
const MAX_STOCK = 1000;
const MAX_PRICE_CLP = 10000000;

// ----------------------------------------------------
// PÁGINA PRINCIPAL DE ADMINISTRACIÓN DE PRODUCTOS
// ----------------------------------------------------

const AdminProductsPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ msg: string, type: 'success' | 'danger' } | null>(null);

    // 🚨 NUEVO: Estados para el modal de confirmación de activar/desactivar
    const [showToggleActiveModal, setShowToggleActiveModal] = useState(false);
    const [itemToToggle, setItemToToggle] = useState<{ id: string, name: string, isActive: boolean } | null>(null);

    // 🚨 NUEVO: Estados para búsqueda y ordenamiento
    const [searchTerm, setSearchTerm] = useState('');
    const [stockSortOrder, setStockSortOrder] = useState<'asc' | 'desc' | ''>('');
    
    // 🚨 ELIMINADO: Ya no necesitamos estados para el modal de borrado.
    const fetchProducts = async () => {
        setLoading(true);
        try {
            // 🚨 CORRECCIÓN: Llamamos a la ruta principal pero con un parámetro para incluir inactivos.
            const { data } = await axios.get(`${API_URL}?includeInactive=true&_=${new Date().getTime()}`);
            setProducts(data.reverse());
            setError(null);
        } catch (err) {
            setError('No se pudo cargar la lista. Asegúrate de que el Backend esté corriendo.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const showStatus = (msg: string, type: 'success' | 'danger') => {
        setStatusMessage({ msg, type });
        setTimeout(() => setStatusMessage(null), 5000);
    };

    // 🚨 ELIMINADO: La función handleDelete y confirmDelete ya no son necesarias.
    // La lógica ahora está centralizada en handleToggleActive.

    // 🚨 CAMBIO: Esta función ahora abre el modal de confirmación
    const confirmToggleActive = (id: string, currentStatus: boolean, name: string) => {
        setItemToToggle({ id, name, isActive: currentStatus });
        setShowToggleActiveModal(true);
    };

    // 🚨 NUEVO: Esta función ejecuta la acción después de la confirmación
    const executeToggleActive = async () => {
        if (!itemToToggle) return;

        const newStatus = !itemToToggle.isActive;
        try {
            // 🚨 CORRECCIÓN: Usamos el endpoint PUT /:id que ya existe para activar/desactivar.
            const { data } = await axios.put<Product>(`${API_URL}/${itemToToggle.id}`, { isActive: newStatus });

            setProducts(prevProducts => prevProducts.map(p => p.id === itemToToggle.id ? data : p));
            showStatus(`Producto "${itemToToggle.name}" cambiado a: ${newStatus ? 'ACTIVO' : 'INACTIVO'}.`, 'success');

        } catch (err) {
            showStatus('Fallo al cambiar el estado del producto.', 'danger');
        } finally {
            setShowToggleActiveModal(false);
            setItemToToggle(null);
        }
    };

    // 🚨 NUEVO: Lógica para filtrar y ordenar productos
    const filteredAndSortedProducts = React.useMemo(() => {
        let filtered = [...products];

        // 1. Filtrar por término de búsqueda (nombre)
        if (searchTerm) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 2. Ordenar por stock
        if (stockSortOrder) {
            filtered.sort((a, b) => {
                if (stockSortOrder === 'asc') {
                    return a.countInStock - b.countInStock;
                } else { // 'desc'
                    return b.countInStock - a.countInStock;
                }
            });
        }

        return filtered;
    }, [products, searchTerm, stockSortOrder]);

    if (loading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
    if (error) return <Container className="py-5"><Alert variant="danger">{error}</Alert></Container>;

    return (
        <AdminLayout>
            <style>{`.admin-search-input::placeholder { color: #999; opacity: 1; }`}</style>

            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                <Link to="/admin">
                    <Button variant="outline-secondary" size="sm">
                        <ArrowLeft size={16} className="me-2" /> Volver al Panel
                    </Button>
                </Link>
                
                <h1 style={{ color: '#1E90FF' }}>Gestión de Productos</h1>

                <Button variant="success" onClick={() => setShowCreateModal(true)}>
                    <PlusCircle size={18} className="me-2" /> Nuevo Producto
                </Button>
            </div>

            {/* 🚨 NUEVO: Fila de filtros (Buscador y Ordenamiento) */}
            <Row className="mb-4 align-items-center">
                <Col md={5}>
                    <Form.Control
                        type="text"
                        placeholder="Buscar por nombre de producto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="admin-search-input"
                        style={{ backgroundColor: '#333', color: 'white', borderColor: '#555' }}
                    />
                </Col>
                <Col md={7} className="text-md-end mt-2 mt-md-0">
                    <span className="me-3 text-muted">Ordenar por Stock:</span>
                    <ButtonGroup>
                        <Button variant={stockSortOrder === 'asc' ? 'primary' : 'outline-secondary'} onClick={() => setStockSortOrder(stockSortOrder === 'asc' ? '' : 'asc')}>
                            Ascendente
                        </Button>
                        <Button variant={stockSortOrder === 'desc' ? 'primary' : 'outline-secondary'} onClick={() => setStockSortOrder(stockSortOrder === 'desc' ? '' : 'desc')}>
                            Descendente
                        </Button>
                    </ButtonGroup>
                </Col>
            </Row>

            {statusMessage && (
                <Alert variant={statusMessage.type} onClose={() => setStatusMessage(null)} dismissible className="mb-4">
                    {statusMessage.msg}
                </Alert>
            )}

            {/* TABLA ESCRITORIO (d-none d-md-block) */}
            <div className="table-responsive d-none d-md-block"> 
                <Table striped bordered hover  className="table-dark"style={{ backgroundColor: '#111', color: 'white' }}>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Categoría</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredAndSortedProducts.map(product => (
                            <tr key={product.id} className={!product.isActive ? 'text-muted' : ''} style={{ opacity: product.isActive ? 1 : 0.6 }}>
                                <td>{product.name}</td>
                                <td>{formatClp(product.price)}</td>
                                <td><Badge bg={product.countInStock > 5 ? 'success' : product.countInStock > 0 ? 'warning' : 'danger'}>{product.countInStock}</Badge></td>
                                <td><Badge bg="info">{product.category}</Badge></td>
                                {/* 🚨 CAMBIO: Ahora solo muestra un Badge de estado */}
                                <td><Badge bg={product.isActive ? 'success' : 'secondary'}>{product.isActive ? 'Activo' : 'Inactivo'}</Badge></td>
                                <td>
                                    <Button variant="info" size="sm" className="me-2" onClick={() => setSelectedProduct(product)}>
                                        <Edit size={14} />
                                    </Button>
                                    {/* 🚨 CAMBIO: El botón de basura se reemplaza por un toggle de activar/desactivar */}
                                    <Button 
                                        variant={product.isActive ? 'warning' : 'success'} 
                                        size="sm" onClick={() => confirmToggleActive(product.id, product.isActive, product.name)} 
                                        title={product.isActive ? 'Desactivar' : 'Activar'}>
                                        {product.isActive ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            {/* VISTA TARJETAS MÓVIL (d-block d-md-none) */}
            <Row className="d-block d-md-none g-3">
                {filteredAndSortedProducts.map(product => (
                    <Col xs={12} key={product.id}>
                        <Card style={{ backgroundColor: '#222', border: `1px solid ${product.isActive ? '#1E90FF' : '#555'}`, color: 'white', opacity: product.isActive ? 1 : 0.7 }}>
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0" style={{ color: '#39FF14' }}>{product.name}</h5>
                                    <Badge bg="info">{product.category}</Badge>
                                </div>

                                <hr style={{ borderColor: '#444' }}/>

                                <p className="mb-1">Precio: <strong>{formatClp(product.price)} CLP</strong></p>
                                <p className="mb-3">Stock: <Badge bg={product.countInStock > 5 ? 'success' : 'warning'}>{product.countInStock}</Badge></p>
                                <p className="mb-3">Estado: <Badge bg={product.isActive ? 'success' : 'secondary'}>{product.isActive ? 'Activo' : 'Inactivo'}</Badge></p>

                                <div className="d-grid gap-2">
                                    <Button variant="info" size="sm" onClick={() => setSelectedProduct(product)}>
                                        <Edit size={14} className="me-1"/> Editar
                                    </Button>
                                    {/* 🚨 CAMBIO: El botón ahora es un toggle claro */}
                                    <Button variant={product.isActive ? 'warning' : 'success'} size="sm" onClick={() => confirmToggleActive(product.id, product.isActive, product.name)}>
                                        {product.isActive ? 'Desactivar' : 'Activar'}
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Modales */}
            <ProductModal
                show={showCreateModal || !!selectedProduct}
                handleClose={() => { setSelectedProduct(null); setShowCreateModal(false); }}
                currentProduct={selectedProduct}
                fetchProducts={fetchProducts}
                showStatus={showStatus}
            />

            {/* 🚨 NUEVO: Modal de confirmación para activar/desactivar */}
            <ConfirmToggleActiveModal
                show={showToggleActiveModal}
                handleClose={() => setShowToggleActiveModal(false)}
                handleConfirm={executeToggleActive}
                itemName={itemToToggle?.name || 'este producto'}
                isActivating={!itemToToggle?.isActive}
            />

            {/* 🚨 ELIMINADO: El modal de confirmación de borrado ya no es necesario */}
        </AdminLayout>
    );
};

export default AdminProductsPage;

// ----------------------------------------------------
// 🚨 NUEVO: MODAL DE CONFIRMACIÓN PARA ACTIVAR/DESACTIVAR
// ----------------------------------------------------

interface ConfirmToggleActiveModalProps {
    show: boolean;
    handleClose: () => void;
    handleConfirm: () => void;
    itemName: string;
    isActivating: boolean;
}

const ConfirmToggleActiveModal: React.FC<ConfirmToggleActiveModalProps> = ({ show, handleClose, handleConfirm, itemName, isActivating }) => (
    <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton style={{ backgroundColor: '#111', borderBottomColor: isActivating ? '#39FF14' : '#FFC107' }}>
            <Modal.Title style={{ color: isActivating ? '#39FF14' : '#FFC107' }}>
                <AlertTriangle size={24} className="me-2" /> Confirmar {isActivating ? 'Activación' : 'Desactivación'}
            </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ backgroundColor: '#222', color: 'white' }}>
            <p>¿Estás seguro de que deseas <strong>{isActivating ? 'ACTIVAR' : 'DESACTIVAR'}</strong> el producto <strong style={{ color: '#39FF14' }}>{itemName}</strong>?</p>
            <Alert variant={isActivating ? 'success' : 'warning'} className="mt-3">{isActivating ? 'El producto volverá a ser visible en la tienda.' : 'El producto se ocultará de la tienda pública.'}</Alert>
        </Modal.Body>

        <Modal.Footer style={{ backgroundColor: '#111' }}>
            <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
            <Button variant={isActivating ? 'success' : 'warning'} onClick={handleConfirm}>Sí, {isActivating ? 'Activar' : 'Desactivar'}</Button>
        </Modal.Footer>
    </Modal>
);

// ----------------------------------------------------
// PRODUCT MODAL
// ----------------------------------------------------

interface ProductModalProps { 
    show: boolean; 
    handleClose: () => void; 
    currentProduct: Product | null; 
    fetchProducts: () => void; 
    showStatus: (msg: string, type: 'success' | 'danger') => void; 
}

const ProductModal: React.FC<ProductModalProps> = ({ show, handleClose, currentProduct, fetchProducts, showStatus }) => {
    
    const isEditing = !!currentProduct;

    // 🚨 CORRECCIÓN: Inicializamos el estado con valores por defecto para evitar el bug de 'isActive' undefined.
    const [formData, setFormData] = useState<Partial<Product>>({ isActive: true });

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (currentProduct) {
            setFormData(currentProduct);
            setPreviewUrl(currentProduct.imageUrl || null);
        } else {
            setFormData({
                name: '',
                description: '',
                price: 0,
                imageUrl: '',
                specifications: '',
                category: 'Consolas',
                countInStock: 0,
                isTopSelling: false,
                rating: 0,
                numReviews: 0,
                isActive: true, // Por defecto, los nuevos productos están activos
            });
            setPreviewUrl(null);
        }
        setError(null);
    }, [currentProduct, show]);

    const updateFormData = (e: React.ChangeEvent<any>) => {
        const { name, value, type } = e.target;
        
        // 🚨 CORRECCIÓN: Manejo de checkboxes y switches
        if (type === 'checkbox' || type === 'switch') {
            setFormData(prev => ({ ...prev, [name]: e.target.checked }));
            return;
        }
        
        if (name === 'price' || name === 'countInStock') {
            const intValue = parseInt(value);
            if (name === 'countInStock' && intValue > MAX_STOCK) return;
            if (name === 'price' && intValue > MAX_PRICE_CLP) return;
            setFormData(prev => ({ ...prev, [name]: isNaN(intValue) ? 0 : intValue }));
            return; 
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? e.target.checked : value,
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onloadend = () => {
                const base64String = reader.result as string;
                setFormData(prev => ({ ...prev, imageUrl: base64String }));
                setPreviewUrl(base64String);
            };

            reader.readAsDataURL(file);

        } else {
            setFormData(prev => ({ ...prev, imageUrl: currentProduct?.imageUrl || '' }));
            setPreviewUrl(currentProduct?.imageUrl || null);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const price = formData.price ?? 0;
        const stock = formData.countInStock ?? 0;

        if (price < 1 || price > MAX_PRICE_CLP || isNaN(price) || !Number.isInteger(price)) {
            setError(`El precio debe ser un número entero positivo, máximo ${formatClp(MAX_PRICE_CLP)}.`);
            setLoading(false);
            return;
        }

        if (stock < 0 || stock > MAX_STOCK || isNaN(stock) || !Number.isInteger(stock)) {
            setError(`El stock debe ser un número entero no negativo, máximo ${MAX_STOCK}.`);
            setLoading(false);
            return;
        }

        if (!formData.imageUrl) {
            setError('Debe proporcionar una imagen.');
            setLoading(false);
            return;
        }

        const payload = { ...formData };
        // 🚨 CORRECCIÓN: Usamos los endpoints POST / y PUT /:id que ya existen.
        const url = isEditing ? `${API_URL}/${currentProduct!.id}` : API_URL;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            await axios({ method, url, data: payload });

            fetchProducts();
            handleClose();
            showStatus(`Producto "${formData.name}" ${isEditing ? 'actualizado' : 'creado'} con éxito.`, 'success');

        } catch (err: any) {
            setError(err.response?.data?.message || `Fallo al ${isEditing ? 'actualizar' : 'crear'} el producto.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="xl">
            <Modal.Header closeButton style={{ backgroundColor: '#111', borderBottomColor: '#1E90FF' }}>
                <Modal.Title style={{ color: '#1E90FF' }}>
                    {isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ backgroundColor: '#222', color: 'white' }}>
                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <h6 className="mb-3" style={{ color: '#39FF14' }}>Información Básica</h6>

                    <Form.Group className="mb-3">
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control type="text" name="name" value={formData.name || ''} onChange={updateFormData} required style={{ backgroundColor: '#333', color: 'white' }} />
                    </Form.Group>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Categoría</Form.Label>
                                <Form.Select name="category" value={formData.category || ''} onChange={updateFormData} required style={{ backgroundColor: '#333', color: 'white' }}>
                                    <option value="">Seleccione una categoría</option>
                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Stock Disponible</Form.Label>
                                <Form.Control type="number" name="countInStock" value={formData.countInStock ?? 0} onChange={updateFormData} min="0" max={MAX_STOCK} style={{ backgroundColor: '#333', color: 'white' }} />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Descripción del Producto</Form.Label>
                        <Form.Control as="textarea" rows={3} name="description" value={formData.description || ''} onChange={updateFormData} style={{ backgroundColor: '#333', color: 'white' }} />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Especificaciones Técnicas</Form.Label>
                        <Form.Control as="textarea" rows={4} name="specifications" value={formData.specifications || ''} onChange={updateFormData} style={{ backgroundColor: '#333', color: 'white' }} />
                    </Form.Group>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Precio (CLP)</Form.Label>
                                <Form.Control type="number" name="price" value={formData.price ?? 0} onChange={updateFormData} min="1" max={MAX_PRICE_CLP} style={{ backgroundColor: '#333', color: 'white' }} />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Estado del Producto</Form.Label>
                                <Form.Check type="switch" id="product-active-switch" label="Producto Activo" name="isActive" checked={formData.isActive ?? true} onChange={updateFormData} />
                                <Form.Text className="text-muted">Si está desactivado, no será visible para los clientes.</Form.Text>
                            </Form.Group>
                        </Col>


                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Producto Más Vendido</Form.Label>
                                <Form.Check type="checkbox" label="Marcar como Top Selling" name="isTopSelling" checked={formData.isTopSelling || false} onChange={updateFormData} />
                            </Form.Group>
                        </Col>
                    </Row>

                    <h6 className="mb-3 mt-4 border-top pt-3" style={{ color: '#39FF14' }}>Imagen</h6>

                    <Row className="mb-3 align-items-center">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Cargar Archivo Local</Form.Label>
                                <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>URL Imagen (Respaldo)</Form.Label>
                                <Form.Control type="text" name="imageUrl" value={formData.imageUrl || ''} onChange={updateFormData} disabled={formData.imageUrl?.startsWith('data:image')} style={{ backgroundColor: '#333', color: 'white' }} />
                            </Form.Group>
                        </Col>

                        {previewUrl && (
                            <Col xs={12} className="text-center mt-3">
                                <img src={previewUrl} alt="preview" style={{ maxWidth: '150px', maxHeight: '150px' }} className="rounded shadow" />
                            </Col>
                        )}
                    </Row>

                    <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                        {loading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Producto'}
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};
