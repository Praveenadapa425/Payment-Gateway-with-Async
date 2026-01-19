// File: PaymentGateway.js
class PaymentGateway {
  constructor(options) {
    // options: {
    //   key: 'key_test_abc123',
    //   orderId: 'order_xyz',
    //   onSuccess: function(response) { },
    //   onFailure: function(error) { },
    //   onClose: function() { }
    // }
    //
    // Implementation:
    // 1. Validate required options
    // 2. Store configuration
    // 3. Prepare iframe modal

    if (!options.key) {
      throw new Error('API key is required');
    }
    if (!options.orderId) {
      throw new Error('Order ID is required');
    }

    this.options = {
      key: options.key,
      orderId: options.orderId,
      onSuccess: options.onSuccess || function() {},
      onFailure: options.onFailure || function() {},
      onClose: options.onClose || function() {}
    };

    this.modal = null;
    this.iframe = null;
    this.overlay = null;
  }
  
  open() {
    // 1. Create modal overlay
    // 2. Create iframe with src pointing to checkout page
    // 3. Set iframe attributes with data-test-id="payment-iframe"
    // 4. Append modal to document body
    // 5. Set up postMessage listener for iframe communication
    // 6. Show modal

    // Create modal container
    this.modal = document.createElement('div');
    this.modal.id = 'payment-gateway-modal';
    this.modal.setAttribute('data-test-id', 'payment-modal');
    this.modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    `;

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 9999;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
      position: relative;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      z-index: 10000;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
    `;

    // Create iframe
    this.iframe = document.createElement('iframe');
    this.iframe.setAttribute('data-test-id', 'payment-iframe');
    this.iframe.src = `http://localhost:3001/checkout?order_id=${this.options.orderId}&embedded=true`;
    this.iframe.style.cssText = `
      width: 100%;
      height: 500px;
      border: none;
    `;

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.setAttribute('data-test-id', 'close-modal-button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      z-index: 10001;
      color: #333;
      padding: 5px;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    closeButton.onclick = () => {
      this.close();
    };

    // Assemble modal
    modalContent.appendChild(closeButton);
    modalContent.appendChild(this.iframe);
    this.modal.appendChild(this.overlay);
    this.modal.appendChild(modalContent);

    // Add modal to document
    document.body.appendChild(this.modal);

    // Set up postMessage listener for iframe communication
    window.addEventListener('message', this.handleMessage.bind(this));
  }
  
  close() {
    // 1. Remove modal from DOM
    // 2. Call onClose callback if provided

    if (this.modal) {
      document.body.removeChild(this.modal);
      this.modal = null;
      this.iframe = null;
      this.overlay = null;
    }

    this.options.onClose();
  }

  handleMessage(event) {
    // Handle messages from the iframe
    if (event.data.type === 'payment_success') {
      this.options.onSuccess(event.data.data);
      this.close();
    } else if (event.data.type === 'payment_failed') {
      this.options.onFailure(event.data.data);
    } else if (event.data.type === 'close_modal') {
      this.close();
    }
  }
}

// Expose globally
window.PaymentGateway = PaymentGateway;