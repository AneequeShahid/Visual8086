.model small
.stack 100h
.data
    
    A DB 7
    B DW 1ABCh
    C DB 'HELLO'

.code
main proc
    ;DS
    mov ax, @data
    mov ds, ax      

    
    mov ah, 4ch
    int 21h
main endp
end main