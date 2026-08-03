import { createApp, h, ref } from 'vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

export function confirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const visible = ref(true)

    const app = createApp({
      setup() {
        return () =>
          h(ConfirmDialog, {
            visible: visible.value,
            message,
            onCancel: () => {
              visible.value = false
              cleanup()
              resolve(false)
            },
            onConfirm: () => {
              visible.value = false
              cleanup()
              resolve(true)
            },
          })
      },
    })

    const cleanup = () => {
      setTimeout(() => {
        app.unmount()
        container.remove()
      }, 200)
    }

    app.mount(container)
  })
}