org 100h

   mov ah, 09h
    lea dx, prompt
    int 21h

    
    mov ah, 01h
    int 21h
    mov bl, al

    
    sub bl, 11h 

    
    mov ah, 09h
    lea dx, result
    int 21h

   
    mov ah, 02h
    mov dl, bl
    int 21h

    
    mov ah, 4ch
    int 21h

    prompt db 'ENTER A HEX DIGIT: $'
    result db 10, 13, 'IN DECIMAL IT IS 1$'