import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CarritoService } from '../data-access/carrito.service';
import { Producto } from '../../producto/interfaces/producto';
import { InventarioService } from '../../inventario/data-access/inventario.service';
import { Router } from '@angular/router';

declare var paypal: any;

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})

export class CarritoComponent implements OnInit {
  carrito: Producto[] = [];

  constructor(
    private carritoService: CarritoService,
    private inventarioService: InventarioService, // Inyectamos el servicio de Inventario
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carrito = this.carritoService.obtenerCarrito();
    //this.inicializarBotonPayPal(); // Inicializamos el botón de PayPal
  }

   // Ejecutar después de que la vista se haya cargado completamente
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.inicializarBotonPayPal(); // Inicializamos el botón de PayPal con un retraso
    }, 500);  // Retraso de 500ms para asegurarnos de que el contenedor esté disponible
  }

  // Aumentar cantidad de producto en carrito
  aumentarCantidad(producto: Producto): void {
    const cantidadMaxima = this.inventarioService.getCantidadDisponible(producto.id);
    if (producto.cantidad < cantidadMaxima) {
      producto.cantidad += 1; // Incrementar en 1 si no sobrepasa el límite de inventario
    } else {
      alert('No puedes agregar más de la cantidad disponible en inventario.');
    }
  }

  // Disminuir cantidad de producto en carrito
  disminuirCantidad(producto: Producto): void {
    if (producto.cantidad > 0) {
      producto.cantidad -= 1; // Disminuir la cantidad en 1 si no es 0
    }
  }

  irAProductos(): void {
    this.router.navigate(['/']);
  }

  eliminarProducto(producto: Producto): void {
    // Llamamos al servicio para eliminar el producto del carrito
    this.carritoService.eliminarProducto(producto);

    // Actualizamos el carrito en el componente
    this.carrito = this.carritoService.obtenerCarrito();
  }

  // Generar el archivo XML del carrito
  generarXML(): void {
    this.carritoService.generarXML();
  }

  // Inicializar el botón de PayPal
  // Inicializar el botón de PayPal
inicializarBotonPayPal(): void {
  paypal.Buttons({
    // Crear la orden de pago
    createOrder: (data: any, actions: any) => {  // Especificar el tipo 'any' para 'data' y 'actions'
      return actions.order.create({
        purchase_units: [{
          amount: {
            value: this.obtenerTotalCarrito().toFixed(2) // Total del carrito
          }
        }]
      });
    },
    // Aprobar el pago
    onApprove: async (data: any, actions: any) => {  // Especificar el tipo 'any' para 'data' y 'actions'
      const orden = await actions.order.capture();
      console.log('Pago exitoso', orden);

      // Vaciar el carrito y generar el XML después de la compra
      this.carritoService.pagarCarrito(orden.id);
      
      // Actualizar el carrito en el componente para reflejar el vaciado
      this.carrito = this.carritoService.obtenerCarrito();  // Actualizamos el carrito

    }
  }).render('#paypal-button-container'); // Renderiza el botón de PayPal en el contenedor
}

  // Calcula el total del carrito
  obtenerTotalCarrito(): number {
    return this.carrito.reduce((total, producto) => total + (producto.precio * producto.cantidad), 0);
  }
}