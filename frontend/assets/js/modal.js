// assets/js/modal.js - 模态框管理

// ===== 创建模态框 =====
export function createModal(options = {}) {
  const {
    title = '标题',
    content = '',
    size = 'medium', // small, medium, large
    showFooter = true,
    confirmText = '确定',
    cancelText = '取消',
    onConfirm = null,
    onCancel = null,
    closeOnOverlay = true
  } = options;

  // 创建模态框容器
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  
  const sizeClass = {
    small: 'max-width: 400px;',
    medium: 'max-width: 600px;',
    large: 'max-width: 800px;'
  }[size];

  overlay.innerHTML = `
    <div class="modal" style="${sizeClass}">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" aria-label="关闭">×</button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
      ${showFooter ? `
        <div class="modal-footer">
          <button class="btn btn-secondary modal-btn-cancel">${cancelText}</button>
          <button class="btn btn-primary modal-btn-confirm">${confirmText}</button>
        </div>
      ` : ''}
    </div>
  `;

  document.body.appendChild(overlay);

  // 模态框实例
  const modalInstance = {
    element: overlay,
    
    // 显示模态框
    show() {
      setTimeout(() => overlay.classList.add('active'), 10);
      document.body.style.overflow = 'hidden';
    },
    
    // 隐藏模态框
    hide() {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(() => overlay.remove(), 300);
    },
    
    // 更新内容
    setContent(newContent) {
      const body = overlay.querySelector('.modal-body');
      if (body) body.innerHTML = newContent;
    },
    
    // 更新标题
    setTitle(newTitle) {
      const titleEl = overlay.querySelector('.modal-title');
      if (titleEl) titleEl.textContent = newTitle;
    }
  };

  // 关闭按钮
  overlay.querySelector('.modal-close').onclick = () => {
    if (onCancel) onCancel();
    modalInstance.hide();
  };

  // 取消按钮
  const cancelBtn = overlay.querySelector('.modal-btn-cancel');
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      if (onCancel) onCancel();
      modalInstance.hide();
    };
  }

  // 确定按钮
  const confirmBtn = overlay.querySelector('.modal-btn-confirm');
  if (confirmBtn) {
    confirmBtn.onclick = () => {
      if (onConfirm) onConfirm(modalInstance);
      else modalInstance.hide();
    };
  }

  // 点击背景关闭
  if (closeOnOverlay) {
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        if (onCancel) onCancel();
        modalInstance.hide();
      }
    };
  }

  // ESC 键关闭
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      if (onCancel) onCancel();
      modalInstance.hide();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  return modalInstance;
}

// ===== 确认对话框 =====
export function showConfirm(message, title = '确认操作') {
  return new Promise((resolve) => {
    const modal = createModal({
      title,
      content: `<p style="margin: 0; font-size: 15px; color: #666;">${message}</p>`,
      size: 'small',
      onConfirm: () => {
        modal.hide();
        resolve(true);
      },
      onCancel: () => {
        modal.hide();
        resolve(false);
      }
    });
    modal.show();
  });
}

// ===== 警告对话框 =====
export function showAlert(message, title = '提示') {
  return new Promise((resolve) => {
    const modal = createModal({
      title,
      content: `<p style="margin: 0; font-size: 15px; color: #666;">${message}</p>`,
      size: 'small',
      cancelText: '',
      confirmText: '知道了',
      onConfirm: () => {
        modal.hide();
        resolve(true);
      }
    });
    
    // 隐藏取消按钮
    const cancelBtn = modal.element.querySelector('.modal-btn-cancel');
    if (cancelBtn) cancelBtn.style.display = 'none';
    
    modal.show();
  });
}

// ===== 输入对话框 =====
export function showPrompt(message, defaultValue = '', title = '请输入') {
  return new Promise((resolve) => {
    const inputId = 'modal-input-' + Date.now();
    const modal = createModal({
      title,
      content: `
        <label for="${inputId}" style="display: block; margin-bottom: 8px; font-size: 14px; color: #666;">
          ${message}
        </label>
        <input 
          type="text" 
          id="${inputId}" 
          value="${defaultValue}" 
          style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 15px;"
        />
      `,
      size: 'small',
      onConfirm: () => {
        const input = document.getElementById(inputId);
        const value = input ? input.value : '';
        modal.hide();
        resolve(value);
      },
      onCancel: () => {
        modal.hide();
        resolve(null);
      }
    });
    modal.show();
    
    // 自动聚焦输入框
    setTimeout(() => {
      const input = document.getElementById(inputId);
      if (input) input.focus();
    }, 100);
  });
}

// ===== 表单模态框 =====
export function showFormModal(options = {}) {
  const {
    title = '表单',
    fields = [],
    onSubmit = null,
    submitText = '提交',
    initialData = {}
  } = options;

  const formId = 'modal-form-' + Date.now();
  
  const formHTML = `
    <form id="${formId}" style="display: flex; flex-direction: column; gap: 16px;">
      ${fields.map((field, index) => {
        const fieldId = `field-${index}`;
        const value = initialData[field.name] || field.defaultValue || '';
        
        if (field.type === 'textarea') {
          return `
            <div>
              <label for="${fieldId}" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                ${field.label} ${field.required ? '<span style="color: #ff5e62;">*</span>' : ''}
              </label>
              <textarea 
                id="${fieldId}" 
                name="${field.name}"
                placeholder="${field.placeholder || ''}"
                ${field.required ? 'required' : ''}
                style="width: 100%; min-height: 100px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 15px; font-family: inherit; resize: vertical;"
              >${value}</textarea>
            </div>
          `;
        } else if (field.type === 'select') {
          return `
            <div>
              <label for="${fieldId}" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                ${field.label} ${field.required ? '<span style="color: #ff5e62;">*</span>' : ''}
              </label>
              <select 
                id="${fieldId}" 
                name="${field.name}"
                ${field.required ? 'required' : ''}
                style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 15px;"
              >
                ${field.options.map(opt => `
                  <option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>
                    ${opt.label}
                  </option>
                `).join('')}
              </select>
            </div>
          `;
        } else {
          return `
            <div>
              <label for="${fieldId}" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                ${field.label} ${field.required ? '<span style="color: #ff5e62;">*</span>' : ''}
              </label>
              <input 
                type="${field.type || 'text'}" 
                id="${fieldId}" 
                name="${field.name}"
                value="${value}"
                placeholder="${field.placeholder || ''}"
                ${field.required ? 'required' : ''}
                ${field.min !== undefined ? `min="${field.min}"` : ''}
                ${field.max !== undefined ? `max="${field.max}"` : ''}
                style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 15px;"
              />
            </div>
          `;
        }
      }).join('')}
    </form>
  `;

  const modal = createModal({
    title,
    content: formHTML,
    confirmText: submitText,
    closeOnOverlay: false,
    onConfirm: async (modalInstance) => {
      const form = document.getElementById(formId);
      
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      
      if (onSubmit) {
        const result = await onSubmit(data);
        if (result !== false) {
          modalInstance.hide();
        }
      } else {
        modalInstance.hide();
      }
    }
  });

  modal.show();
  return modal;
}

// ===== 图片预览模态框 =====
export function showImageModal(imageSrc, title = '图片预览') {
  const modal = createModal({
    title,
    content: `
      <img 
        src="${imageSrc}" 
        alt="${title}" 
        style="width: 100%; height: auto; display: block; border-radius: 8px;"
      />
    `,
    size: 'large',
    showFooter: false
  });
  modal.show();
  return modal;
}

// ===== 内容模态框 =====
export function showContentModal(content, title = '详情', size = 'medium') {
  const modal = createModal({
    title,
    content,
    size,
    showFooter: false
  });
  modal.show();
  return modal;
}

// ===== 关闭所有模态框 =====
export function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 300);
  });
  document.body.style.overflow = '';
}