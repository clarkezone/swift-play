Goal:

Plan:

Arch:
  - Interfaces
     - IChessPiece
       - Get all moves for cell with boardstate
       - Make Move (or should that be on Board)?
   - Types
    - BoardState: array corresponding to bitmap of cells containing IChessPiece
      - MovePiece(?from, to)
      - Reset
    - CPRook: congrete type
   - Tests
    - ResetBoard
   - Tests
