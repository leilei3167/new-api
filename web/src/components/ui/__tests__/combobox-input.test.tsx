/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ComboboxInput } from '../combobox-input'

const options = [
  { value: 'gpt-4', label: 'gpt-4' },
  { value: 'gpt-5', label: 'gpt-5' },
]

// A dialog centered with a CSS transform reports these viewport coordinates
// via getBoundingClientRect(); jsdom performs no layout, so the geometry the
// production positioning bug depends on must be stubbed explicitly.
const DIALOG_RECT: DOMRect = {
  top: 200,
  left: 300,
  bottom: 400,
  right: 700,
  width: 400,
  height: 200,
  x: 300,
  y: 200,
  toJSON: () => ({}),
}

const INPUT_RECT: DOMRect = {
  top: 250,
  left: 320,
  bottom: 270,
  right: 500,
  width: 180,
  height: 20,
  x: 320,
  y: 250,
  toJSON: () => ({}),
}

function stubRect(element: Element, rect: DOMRect) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(rect)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ComboboxInput portal positioning', () => {
  it('anchors the dropdown relative to an enclosing dialog instead of the viewport', async () => {
    render(
      <div role='dialog'>
        <ComboboxInput
          options={options}
          value=''
          onValueChange={() => {}}
          aria-label='Model'
        />
      </div>
    )
    const dialog = screen.getByRole('dialog')
    const input = screen.getByRole('combobox', { name: 'Model' })
    stubRect(dialog, DIALOG_RECT)
    stubRect(input, INPUT_RECT)

    const user = userEvent.setup()
    await user.click(input)

    const listbox = await screen.findByRole('listbox')
    const dropdown = listbox.parentElement as HTMLElement

    // Correct math: coordinates relative to the dialog's own box, rendered
    // with `position: absolute` so the dialog's containing block applies.
    expect(dropdown.style.position).toBe('absolute')
    expect(dropdown.style.top).toBe('74px')
    expect(dropdown.style.left).toBe('20px')
  })

  it('keeps viewport-relative fixed positioning without a dialog ancestor', async () => {
    render(
      <ComboboxInput
        options={options}
        value=''
        onValueChange={() => {}}
        aria-label='Model'
      />
    )
    const input = screen.getByRole('combobox', { name: 'Model' })
    stubRect(input, INPUT_RECT)

    const user = userEvent.setup()
    await user.click(input)

    const listbox = await screen.findByRole('listbox')
    const dropdown = listbox.parentElement as HTMLElement

    expect(dropdown.style.position).toBe('fixed')
    expect(dropdown.style.top).toBe('274px')
    expect(dropdown.style.left).toBe('320px')
  })
})
